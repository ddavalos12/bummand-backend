import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PracticasServicio } from './practicas.servicio';
import { CrearAprobacionDto } from './dtos/crear-aprobacion.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@UseGuards(JwtGuardia, RolesGuardia)
@Controller('practicas')
export class PracticasControlador {
  constructor(private readonly servicio: PracticasServicio) {}

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('aprobaciones')
  crear(@Body() dto: CrearAprobacionDto, @UsuarioActual() usuario: Usuario) {
    return this.servicio.crear(dto, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('aprobaciones')
  listar() {
    return this.servicio.listar();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('aprobaciones/becario/:becario_id')
  obtenerPorBecario(@Param('becario_id', ParseIntPipe) becario_id: number) {
    return this.servicio.obtenerPorBecario(becario_id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('aprobaciones/:id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtenerPorId(id);
  }
}
