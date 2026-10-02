import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosServicio } from '../usuarios/usuarios.servicio';
import { EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
import { InicioSesionDto } from './dtos/inicio-sesion.dto';
import { compararContrasena } from '../../utilidades/hash.utilidad';

@Injectable()
export class AutenticacionServicio {
  constructor(
    private readonly usuariosServicio: UsuariosServicio,
    private readonly jwtService: JwtService,
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
}

