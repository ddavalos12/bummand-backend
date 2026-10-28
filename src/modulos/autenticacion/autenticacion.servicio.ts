import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuariosServicio } from '../usuarios/usuarios.servicio';
import { Usuario, Rol, EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { InicioSesionDto } from './dtos/inicio-sesion.dto';
import { RegistroBecarioDto } from './dtos/registro-becario.dto';
import { compararContrasena, hashearContrasena } from '../../utilidades/hash.utilidad';

@Injectable()
export class AutenticacionServicio {
  constructor(
    private readonly usuariosServicio: UsuariosServicio,
    private readonly jwtService: JwtService,
    @InjectRepository(Becario)
    private readonly becarioRepositorio: Repository<Becario>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
  ) {}

  async iniciarSesion(dto: InicioSesionDto) {
    const usuario = await this.usuariosServicio.obtenerPorCorreoConRelaciones(dto.correo);
    
    if (!usuario || !(await compararContrasena(dto.contrasena, usuario.contrasena_hash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estado === EstadoUsuario.INACTIVO) {
      throw new UnauthorizedException('Usuario institucional deshabilitado o inactivo');
    }

    const payload = { sub: usuario.id, correo: usuario.correo, rol: usuario.rol };
    return {
      mensaje: 'Inicio de sesión exitoso',
      token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        becario_id: usuario.becario ? usuario.becario.id : null,
      },
    };
  }

  async renovarSesion(usuario_id: number) {
    const usuario = await this.usuariosServicio.obtenerPorIdConRelaciones(usuario_id);

    if (!usuario) {
      throw new UnauthorizedException('Usuario institucional no encontrado');
    }

    if (usuario.estado === EstadoUsuario.INACTIVO) {
      throw new UnauthorizedException('Usuario institucional deshabilitado o inactivo');
    }

    const payload = { sub: usuario.id, correo: usuario.correo, rol: usuario.rol };
    return {
      mensaje: 'Sesión renovada exitosamente',
      token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        becario_id: usuario.becario ? usuario.becario.id : null,
      },
    };
  }

  async confirmarCorreo(dto: { token: string; correo?: string }) {
    const usuario = await this.usuariosServicio.confirmarCorreo(dto.token, dto.correo);
    return {
      mensaje: 'Correo confirmado exitosamente',
      confirmado: true,
      usuario_id: usuario.id,
      correo: usuario.correo,
    };
  }

  async verificarCi(ci: string) {
    const ci_solicitado = (ci || '').trim();
    if (!ci_solicitado) {
      throw new BadRequestException('El número de carnet de identidad (C.I.) es obligatorio');
    }

    const ci_digitos = ci_solicitado.replace(/[^0-9]/g, '');

    const becarios_registrados = await this.becarioRepositorio.find({
      relations: { usuario: true },
    });

    const becario_coincidente = becarios_registrados.find((b) => {
      if (!b.ci) return false;
      const ci_actual_limpio = b.ci.trim().toLowerCase();
      const ci_actual_digitos = b.ci.replace(/[^0-9]/g, '');
      return (
        ci_actual_limpio === ci_solicitado.toLowerCase() ||
        (ci_digitos.length >= 5 && ci_actual_digitos === ci_digitos)
      );
    });

    if (!becario_coincidente) {
      return {
        existe: false,
        ya_registrado: false,
        mensaje: `El C.I. ${ci_solicitado} no figura en la nómina oficial de becarios cargada por la administración.`,
      };
    }

    if (becario_coincidente.usuario_id && becario_coincidente.usuario) {
      return {
        existe: true,
        ya_registrado: true,
        nombre: becario_coincidente.nombre,
        correo: becario_coincidente.usuario.correo,
        mensaje: `El becario con C.I. ${becario_coincidente.ci} ya cuenta con una cuenta activa (${becario_coincidente.usuario.correo}). Inicie sesión.`,
      };
    }

    return {
      existe: true,
      ya_registrado: false,
      nombre: becario_coincidente.nombre,
      carrera: becario_coincidente.carrera,
      universidad: becario_coincidente.universidad,
      mensaje: 'Becario verificado en nómina institucional. Listo para crear credenciales.',
    };
  }

  async registrarBecario(dto: RegistroBecarioDto) {
    const ci_solicitado = (dto.ci || '').trim();
    if (!ci_solicitado) {
      throw new BadRequestException('El número de carnet de identidad (C.I.) es obligatorio');
    }

    const ci_digitos = ci_solicitado.replace(/[^0-9]/g, '');

    const becarios_registrados = await this.becarioRepositorio.find({
      relations: { usuario: true },
    });

    const becario_coincidente = becarios_registrados.find((b) => {
      if (!b.ci) return false;
      const ci_actual_limpio = b.ci.trim().toLowerCase();
      const ci_actual_digitos = b.ci.replace(/[^0-9]/g, '');
      return (
        ci_actual_limpio === ci_solicitado.toLowerCase() ||
        (ci_digitos.length >= 5 && ci_actual_digitos === ci_digitos)
      );
    });

    if (!becario_coincidente) {
      throw new NotFoundException(
        `El C.I. ${ci_solicitado} no coincide con ningún becario registrado en la nómina oficial por la administración. Comuníquese con la Coordinación de BUMAND.`
      );
    }

    if (becario_coincidente.usuario_id && becario_coincidente.usuario) {
      throw new ConflictException(
        `El becario con C.I. ${becario_coincidente.ci} ya cuenta con un usuario activo en el sistema (${becario_coincidente.usuario.correo}). Inicie sesión directamente.`
      );
    }

    const correo_limpio = dto.correo.trim().toLowerCase();
    const usuario_existente =
      (await this.usuarioRepositorio.findOne({
        where: { correo: correo_limpio },
      })) ||
      (await this.usuariosServicio.obtenerPorCorreoConRelaciones(correo_limpio));

    if (usuario_existente) {
      throw new ConflictException(
        'El correo electrónico ya se encuentra registrado con otra cuenta institucional'
      );
    }

    const nombre_becario =
      dto.nombre?.trim() ||
      becario_coincidente.nombre ||
      'Estudiante Becario BUMAND';

    const nuevo_usuario = this.usuarioRepositorio.create({
      nombre: nombre_becario,
      correo: correo_limpio,
      contrasena_hash: await hashearContrasena(dto.contrasena),
      rol: Rol.BECARIO,
      estado: EstadoUsuario.ACTIVO,
      correo_confirmado: true,
    });

    const usuario_guardado = await this.usuarioRepositorio.save(nuevo_usuario);

    becario_coincidente.usuario_id = usuario_guardado.id;
    becario_coincidente.usuario = usuario_guardado;
    if (!becario_coincidente.nombre) {
      becario_coincidente.nombre = nombre_becario;
    }
    await this.becarioRepositorio.save(becario_coincidente);

    const payload = {
      sub: usuario_guardado.id,
      correo: usuario_guardado.correo,
      rol: usuario_guardado.rol,
    };

    return {
      mensaje: 'Registro de becario exitoso y vinculado a la nómina institucional',
      token: this.jwtService.sign(payload),
      usuario: {
        id: usuario_guardado.id,
        nombre: usuario_guardado.nombre,
        correo: usuario_guardado.correo,
        rol: usuario_guardado.rol,
        becario_id: becario_coincidente.id,
      },
    };
  }
}

