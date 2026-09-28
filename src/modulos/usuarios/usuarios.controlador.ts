import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { UsuariosServicio } from './usuarios.servicio';
import { CrearUsuarioDto } from './dtos/crear-usuario.dto';
import { Usuario } from './entidades/usuario.entidad';

@Controller('usuarios')
export class UsuariosControlador {
  constructor(private readonly usuariosServicio: UsuariosServicio) {}

  @Post()
  crear(@Body() crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
    return this.usuariosServicio.crear(crearUsuarioDto);
  }

  @Get()
  obtenerTodos(): Promise<Usuario[]> {
    return this.usuariosServicio.obtenerTodos();
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<Usuario> {
    return this.usuariosServicio.obtenerPorId(id);
  }
}
