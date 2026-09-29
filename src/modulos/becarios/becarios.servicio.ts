import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Becario } from './entidades/becario.entidad';
import { Usuario, Rol, EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
import { CrearBecarioDto } from './dtos/crear-becario.dto';
import { ActualizarBecarioDto } from './dtos/actualizar-becario.dto';
import { Iglesia } from '../iglesias/entidades/iglesia.entidad';
import { lugar_practica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { hashearContrasena } from '../../utilidades/hash.utilidad';

@Injectable()
export class BecariosServicio {
  constructor(
    @InjectRepository(Becario)
    private readonly becarioRepositorio: Repository<Becario>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
  ) {}

  async validarSupervisor(supervisor_id: number): Promise<void> {
    const supervisor = await this.usuarioRepositorio.findOne({ where: { id: supervisor_id } });
    if (!supervisor) {
      throw new BadRequestException('El supervisor indicado no existe');
    }
    if (supervisor.rol !== Rol.SUPERVISOR && supervisor.rol !== Rol.ADMINISTRADOR) {
      throw new BadRequestException('El usuario indicado no es un supervisor ni administrador');
    }
    if (supervisor.estado !== EstadoUsuario.ACTIVO) {
      throw new BadRequestException('El supervisor no está activo');
    }
  }

  async crear(dto: CrearBecarioDto): Promise<Becario> {
    const correoExistente = await this.usuarioRepositorio.findOne({ where: { correo: dto.correo } });
    if (correoExistente) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    if (dto.supervisor_id) {
      await this.validarSupervisor(dto.supervisor_id);
    }

    const nuevoUsuario = this.usuarioRepositorio.create({
      nombre: dto.nombre,
      correo: dto.correo,
      contrasenaHash: await hashearContrasena(dto.contrasena),
      rol: Rol.BECARIO,
      estado: EstadoUsuario.ACTIVO,
    });

    const usuarioGuardado = await this.usuarioRepositorio.save(nuevoUsuario);

    const nuevoBecario = this.becarioRepositorio.create({
      carrera: dto.carrera,
      universidad: dto.universidad,
      institucion: dto.institucion || null,
      unidad: dto.unidad || null,
      fecha_ingreso: new Date(dto.fecha_ingreso),
      iglesia: dto.iglesia_id ? ({ id: dto.iglesia_id } as Iglesia) : null,
      lugar_practica: dto.lugar_practica_id ? ({ id: dto.lugar_practica_id } as lugar_practica) : null,
      supervisor: dto.supervisor_id ? ({ id: dto.supervisor_id } as Usuario) : null,
      usuario: usuarioGuardado,
    });

    return this.becarioRepositorio.save(nuevoBecario);
  }

  async listar(usuario: Usuario): Promise<Becario[]> {
    const query = this.becarioRepositorio.createQueryBuilder('becario')
      .leftJoinAndSelect('becario.usuario', 'usuario')
      .leftJoinAndSelect('becario.supervisor', 'supervisor')
      .leftJoinAndSelect('becario.lugar_practica', 'lugar_practica')
      .leftJoinAndSelect('becario.iglesia', 'iglesia')
      .orderBy('becario.id', 'ASC');

    if (usuario.rol === Rol.SUPERVISOR) {
      query.where('becario.supervisor_id = :id', { id: usuario.id });
    }

    return query.getMany();
  }

  async obtener(id: number, usuario: Usuario): Promise<Becario> {
    const becario = await this.becarioRepositorio.findOne({
      where: { id },
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
    });

    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (usuario.rol === Rol.SUPERVISOR && becario.supervisor?.id !== usuario.id) {
      throw new NotFoundException('Becario no encontrado'); // No revelar si existe
    }

    return becario;
  }

  async obtenerPorUsuario(usuario_id: number): Promise<Becario | null> {
    return this.becarioRepositorio.findOne({
      where: { usuario: { id: usuario_id } },
      relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
    });
  }

  async actualizar(id: number, dto: ActualizarBecarioDto): Promise<Becario> {
    const becario = await this.becarioRepositorio.findOne({ where: { id }, relations: { usuario: true } });
    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (dto.supervisor_id) {
      await this.validarSupervisor(dto.supervisor_id);
    }

    // Actualizar usuario si hay nombre
    if (dto.nombre && becario.usuario) {
      becario.usuario.nombre = dto.nombre;
      await this.usuarioRepositorio.save(becario.usuario);
    }

    // Actualizar becario
    if (dto.carrera !== undefined) becario.carrera = dto.carrera;
    if (dto.universidad !== undefined) becario.universidad = dto.universidad;
    if (dto.institucion !== undefined) becario.institucion = dto.institucion || null;
    if (dto.unidad !== undefined) becario.unidad = dto.unidad || null;
    
    if (dto.iglesia_id !== undefined) {
      becario.iglesia = dto.iglesia_id ? ({ id: dto.iglesia_id } as Iglesia) : null;
    }
    if (dto.lugar_practica_id !== undefined) {
      becario.lugar_practica = dto.lugar_practica_id ? ({ id: dto.lugar_practica_id } as lugar_practica) : null;
    }
    if (dto.supervisor_id !== undefined) {
      becario.supervisor = dto.supervisor_id ? ({ id: dto.supervisor_id } as Usuario) : null;
    }

    return this.becarioRepositorio.save(becario);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const becario = await this.becarioRepositorio.findOne({ where: { id }, relations: { usuario: true } });
    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (becario.usuario) {
      becario.usuario.estado = EstadoUsuario.INACTIVO;
      await this.usuarioRepositorio.save(becario.usuario);
    }

    return { mensaje: 'Becario desactivado correctamente' };
  }
}

