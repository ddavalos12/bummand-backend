import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { NotificacionesServicio } from './notificaciones.servicio';
import { CrearNotificacionDto } from './dtos/crear-notificacion.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

@UseGuards(JwtGuardia)
@Controller('notificaciones')
export class NotificacionesControlador {
  constructor(private readonly servicio: NotificacionesServicio) {}

  @Post()
  crear(@Body() dto: CrearNotificacionDto) {
    return this.servicio.crear(dto);
  }

  @Get('mis-notificaciones')
  listarMisNotificaciones(@UsuarioActual() usuario: Usuario) {
    return this.servicio.listarPorUsuario(usuario.id);
  }

  @Get('no-leidas/conteo')
  contarNoLeidas(@UsuarioActual() usuario: Usuario) {
    return this.servicio.contarNoLeidas(usuario.id);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    return this.servicio.marcarLeida(id, usuario.id);
  }
}
