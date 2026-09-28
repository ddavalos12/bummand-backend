import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Becario } from './entidades/becario.entidad';
import { Usuario, Rol, EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
import { CrearBecarioDto } from './dtos/crear-becario.dto';
import { ActualizarBecarioDto } from './dtos/actualizar-becario.dto';
import { Iglesia } from '../iglesias/entidades/iglesia.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { hashearContrasena } from '../../utilidades/hash.utilidad';

@Injectable()
export class BecariosServicio {
  constructor(
    @InjectRepository(Becario)
    private readonly becarioRepositorio: Repository<Becario>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
  ) {}

  async validarSupervisor(supervisorId: number): Promise<void> {
    const supervisor = await this.usuarioRepositorio.findOne({ where: { id: supervisorId } });
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

    if (dto.supervisorId) {
      await this.validarSupervisor(dto.supervisorId);
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
      fechaIngreso: new Date(dto.fechaIngreso),
      iglesia: dto.iglesiaId ? ({ id: dto.iglesiaId } as Iglesia) : null,
      lugarPractica: dto.lugarPracticaId ? ({ id: dto.lugarPracticaId } as LugarPractica) : null,
      supervisor: dto.supervisorId ? ({ id: dto.supervisorId } as Usuario) : null,
      usuario: usuarioGuardado,
    });

    return this.becarioRepositorio.save(nuevoBecario);
  }

  async listar(usuario: Usuario): Promise<Becario[]> {
    const query = this.becarioRepositorio.createQueryBuilder('becario')
      .leftJoinAndSelect('becario.usuario', 'usuario')
      .leftJoinAndSelect('becario.supervisor', 'supervisor')
      .leftJoinAndSelect('becario.lugarPractica', 'lugarPractica')
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
      relations: { usuario: true, supervisor: true, lugarPractica: true, iglesia: true },
    });

    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (usuario.rol === Rol.SUPERVISOR && becario.supervisor?.id !== usuario.id) {
      throw new NotFoundException('Becario no encontrado'); // No revelar si existe
    }

    return becario;
  }

  async obtenerPorUsuario(usuarioId: number): Promise<Becario | null> {
    return this.becarioRepositorio.findOne({
      where: { usuario: { id: usuarioId } },
      relations: { usuario: true, supervisor: true, lugarPractica: true, iglesia: true },
    });
  }

  async actualizar(id: number, dto: ActualizarBecarioDto): Promise<Becario> {
    const becario = await this.becarioRepositorio.findOne({ where: { id }, relations: { usuario: true } });
    if (!becario) throw new NotFoundException('Becario no encontrado');

    if (dto.supervisorId) {
      await this.validarSupervisor(dto.supervisorId);
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
    
    if (dto.iglesiaId !== undefined) {
      becario.iglesia = dto.iglesiaId ? ({ id: dto.iglesiaId } as Iglesia) : null;
    }
    if (dto.lugarPracticaId !== undefined) {
      becario.lugarPractica = dto.lugarPracticaId ? ({ id: dto.lugarPracticaId } as LugarPractica) : null;
    }
    if (dto.supervisorId !== undefined) {
      becario.supervisor = dto.supervisorId ? ({ id: dto.supervisorId } as Usuario) : null;
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
