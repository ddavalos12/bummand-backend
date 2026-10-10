import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EventosServicio } from './eventos.servicio';
import { Evento } from './entidades/evento.entidad';
import { AsistenciaEvento } from './entidades/asistencia-evento.entidad';
import { CrearEventoDto } from './dtos/crear-evento.dto';
import { ActualizarEventoDto } from './dtos/actualizar-evento.dto';
import { MarcarAsistenciaEventoDto } from './dtos/marcar-asistencia-evento.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Eventos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('eventos')
export class EventosControlador {
  constructor(private readonly eventos_servicio: EventosServicio) {}

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @Post()
  @ApiOperation({
    summary: 'Convocar o programar un nuevo evento',
    description: 'Permite a administradores o supervisores dar de alta un evento diaconal con coordenadas y radio perimetral de tolerancia.',
  })
  @ApiResponse({ status: 201, description: 'Evento registrado con éxito.', type: Evento })
  @ApiResponse({ status: 400, description: 'Datos de convocatoria inválidos.' })
  crear(
    @Body() crearEventoDto: CrearEventoDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Evento> {
    return this.eventos_servicio.crear(crearEventoDto, usuario.id);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar datos de un evento',
    description: 'Modifica horarios, estado, descripción o perímetro geodésico de un evento existente.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del evento', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Evento actualizado exitosamente.', type: Evento })
  @ApiResponse({ status: 404, description: 'Evento no encontrado.' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarEventoDto: ActualizarEventoDto,
  ): Promise<Evento> {
    return this.eventos_servicio.actualizar(id, actualizarEventoDto);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get()
  @ApiOperation({
    summary: 'Listar la agenda de eventos institucionales',
    description: 'Retorna el catálogo cronológico de eventos programados, en curso y finalizados.',
  })
  @ApiResponse({ status: 200, description: 'Listado cronológico de eventos.', type: [Evento] })
  obtenerTodos(): Promise<Evento[]> {
    return this.eventos_servicio.obtenerTodos();
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un evento por ID',
    description: 'Consulta los pormenores de la convocatoria incluyendo el listado de asistencias consolidadas.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del evento', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle del evento.', type: Evento })
  @ApiResponse({ status: 404, description: 'Evento no encontrado.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<Evento> {
    return this.eventos_servicio.obtenerPorId(id);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @Post(':id/asistencia')
  @ApiOperation({
    summary: 'Marcar asistencia geodésica a un evento',
    description: 'Calcula mediante fórmula de Haversine la distancia exacta entre el becario y el recinto del evento para validar presencia.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del evento', type: Number, example: 1 })
  @ApiResponse({ status: 201, description: 'Asistencia registrada con éxito.', type: AsistenciaEvento })
  @ApiResponse({ status: 409, description: 'El becario ya registró asistencia previa para este evento.' })
  @ApiResponse({ status: 404, description: 'Evento o perfil de becario no encontrado.' })
  marcarAsistencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarcarAsistenciaEventoDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<AsistenciaEvento> {
    return this.eventos_servicio.marcarAsistencia(id, dto, usuario.id);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @Get(':id/asistencias')
  @ApiOperation({
    summary: 'Listar nómina de asistentes a un evento',
    description: 'Permite a supervisores y administradores revisar el acta digital con distancias y estado de cada marcación.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del evento', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Listado de marcaciones registradas.', type: [AsistenciaEvento] })
  obtenerAsistencias(@Param('id', ParseIntPipe) id: number): Promise<AsistenciaEvento[]> {
    return this.eventos_servicio.obtenerAsistenciasEvento(id);
  }
}
