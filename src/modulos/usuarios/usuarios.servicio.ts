import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entidades/usuario.entidad';
import { CrearUsuarioDto } from './dtos/crear-usuario.dto';

@Injectable()
export class UsuariosServicio {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
  ) {}

  async crear(crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
    const nuevoUsuario = this.usuarioRepositorio.create(crearUsuarioDto);
    return this.usuarioRepositorio.save(nuevoUsuario);
  }

  async obtenerTodos(): Promise<Usuario[]> {
    return this.usuarioRepositorio.find();
  }

  async obtenerPorId(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.findOneBy({ id });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return usuario;
  }
}
