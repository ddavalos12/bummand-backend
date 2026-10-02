import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificacionesServicio } from './notificaciones.servicio';
import { CrearNotificacionDto } from './dtos/crear-notificacion.dto';
import { Notificacion } from './entidades/notificacion.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Notificaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia)
@Controller('notificaciones')
export class NotificacionesControlador {
  constructor(private readonly servicio: NotificacionesServicio) {}

  @Post()
  @ApiOperation({
    summary: 'Emitir nueva notificación',
    description: 'Registra un aviso para un usuario en base de datos y lo sincroniza para push.',
  })
  @ApiResponse({ status: 201, description: 'Notificación registrada con éxito.', type: Notificacion })
  crear(@Body() dto: CrearNotificacionDto) {
    return this.servicio.crear(dto);
  }

  @Get('mis-notificaciones')
  @ApiOperation({
    summary: 'Listar notificaciones del usuario autenticado',
    description: 'Retorna todas las alertas y avisos del usuario en orden cronológico inverso.',
  })
  @ApiResponse({ status: 200, description: 'Bandeja de notificaciones.', type: [Notificacion] })
  listarMisNotificaciones(@UsuarioActual() usuario: Usuario) {
    return this.servicio.listarPorUsuario(usuario.id);
  }

  @Get('no-leidas/conteo')
  @ApiOperation({
    summary: 'Contar notificaciones no leídas',
    description: 'Devuelve la cantidad numérica de alertas sin leer para renderizar en el badge de la interfaz.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conteo numérico de no leídas.',
    schema: { example: { total: 3 } },
  })
  contarNoLeidas(@UsuarioActual() usuario: Usuario) {
    return this.servicio.contarNoLeidas(usuario.id);
  }

  @Patch(':id/leer')
  @ApiOperation({
    summary: 'Marcar notificación como leída',
    description: 'Actualiza el estado de lectura de una notificación determinada.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la notificación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída.', type: Notificacion })
  marcarLeida(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: Usuario) {
    return this.servicio.marcarLeida(id, usuario.id);
  }
}
