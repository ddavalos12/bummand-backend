import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, Rol, EstadoUsuario } from './entidades/usuario.entidad';
import { CrearUsuarioDto } from './dtos/crear-usuario.dto';
import { hashearContrasena } from '../../utilidades/hash.utilidad';

@Injectable()
export class UsuariosServicio {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
  ) {}

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    if (dto.rol === Rol.BECARIO) {
      throw new ConflictException('Los becarios deben crearse desde el módulo de becarios.');
    }

    const existente = await this.usuarioRepositorio.findOne({ where: { correo: dto.correo } });
    if (existente) {
      throw new ConflictException('Ya existe un usuario con este correo.');
    }

    const nuevoUsuario = this.usuarioRepositorio.create({
      ...dto,
      contrasenaHash: await hashearContrasena(dto.contrasena),
    });

    return this.usuarioRepositorio.save(nuevoUsuario);
  }

  async listar(rolFiltro?: Rol): Promise<Usuario[]> {
    const whereCondition = rolFiltro ? { rol: rolFiltro } : {};
    return this.usuarioRepositorio.find({
      where: whereCondition,
      select: {
        id: true,
        nombre: true,
        correo: true,
        rol: true,
        estado: true,
        createdAt: true
      },
      order: { id: 'ASC' },
    });
  }

  async cambiarEstado(id: number, estado: EstadoUsuario): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    usuario.estado = estado;
    return this.usuarioRepositorio.save(usuario);
  }

  async obtenerTodos(): Promise<Usuario[]> {
    return this.usuarioRepositorio.find();
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    return this.usuarioRepositorio.findOne({ where: { id } });
  }
}
