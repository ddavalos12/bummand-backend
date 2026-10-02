import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PasajesServicio } from './pasajes.servicio';
import { SolicitudPasajes } from './entidades/solicitud-pasaje.entidad';
import { CrearSolicitudPasajeDto } from './dtos/crear-solicitud-pasaje.dto';
import { AgregarRecorridoDto } from './dtos/agregar-recorrido.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Pasajes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('pasajes')
export class PasajesControlador {
  constructor(private readonly pasajesServicio: PasajesServicio) {}

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post()
  @ApiOperation({
    summary: 'Crear solicitud mensual de pasajes',
    description: 'Abre un nuevo borrador de solicitud mensual de viáticos de transporte para el periodo indicado.',
  })
  @ApiResponse({ status: 201, description: 'Solicitud creada en estado borrador.', type: SolicitudPasajes })
  @ApiResponse({ status: 400, description: 'Ya existe una solicitud para este periodo o datos inválidos.' })
  crear(@Body() crearSolicitudPasajeDto: CrearSolicitudPasajeDto, @UsuarioActual() usuario: Usuario): Promise<SolicitudPasajes> {
    crearSolicitudPasajeDto.becario_id = usuario.id;
    return this.pasajesServicio.crear(crearSolicitudPasajeDto);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post('recorridos')
  @ApiOperation({
    summary: 'Registrar tramo de transporte diario',
    description: 'Añade un recorrido (ida o vuelta) con tarifa, origen, destino y coordenadas GPS, recalculando el 80% en centavos.',
  })
  @ApiResponse({ status: 201, description: 'Recorrido registrado y totales actualizados.' })
  agregarRecorrido(@Body() agregarRecorridoDto: AgregarRecorridoDto, @UsuarioActual() usuario: Usuario) {
    agregarRecorridoDto.becario_id = usuario.id;
    return this.pasajesServicio.agregarRecorrido(agregarRecorridoDto);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get()
  @ApiOperation({
    summary: 'Listar todas las solicitudes de pasajes',
    description: 'Retorna el catálogo completo de solicitudes de viáticos para revisión y auditoría.',
  })
  @ApiResponse({ status: 200, description: 'Listado de solicitudes.', type: [SolicitudPasajes] })
  obtenerTodas(): Promise<SolicitudPasajes[]> {
    return this.pasajesServicio.obtenerTodas();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener solicitud de pasajes por ID',
    description: 'Consulta los tramos desglosados, montos totales declarados y reembolso del 80% de una solicitud.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la solicitud', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle de la solicitud.', type: SolicitudPasajes })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<SolicitudPasajes> {
    return this.pasajesServicio.obtenerPorId(id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id')
  @ApiOperation({
    summary: 'Listar solicitudes de un becario',
    description: 'Retorna el histórico de solicitudes mensuales de un becario determinado.',
  })
  @ApiParam({ name: 'becario_id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Historial de solicitudes del becario.', type: [SolicitudPasajes] })
  obtenerPorBecario(@Param('becario_id', ParseIntPipe) becario_id: number): Promise<SolicitudPasajes[]> {
    return this.pasajesServicio.obtenerPorBecario(becario_id);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post(':id/enviar')
  @ApiOperation({
    summary: 'Enviar solicitud formal a revisión (Regla del Día 24)',
    description: 'Cambia el estado de borrador a pendiente. Valida que el envío se realice a partir del día 24 de cada mes.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la solicitud', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Solicitud enviada a revisión con éxito.', type: SolicitudPasajes })
  @ApiResponse({ status: 400, description: 'Intento de envío previo al día 24 o solicitud vacía.' })
  enviarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ): Promise<SolicitudPasajes> {
    return this.pasajesServicio.enviarSolicitud(id, usuario.id);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Patch(':id/enviar')
  @ApiOperation({
    summary: 'Enviar solicitud formal a revisión (Alias PATCH)',
    description: 'Variante PATCH de envío formal aplicando la regla del día 24.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la solicitud', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Solicitud enviada a revisión con éxito.', type: SolicitudPasajes })
  enviarSolicitudPatch(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ): Promise<SolicitudPasajes> {
    return this.pasajesServicio.enviarSolicitud(id, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/aprobar')
  @ApiOperation({
    summary: 'Aprobar solicitud de viáticos',
    description: 'Dictamina la aprobación formal de la solicitud mensual de pasajes por parte del supervisor.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la solicitud', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Solicitud aprobada.', type: SolicitudPasajes })
  aprobarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ): Promise<SolicitudPasajes> {
    return this.pasajesServicio.aprobarSolicitud(id, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/rechazar')
  @ApiOperation({
    summary: 'Rechazar u observar solicitud de viáticos',
    description: 'Rechaza la solicitud exigiendo obligatoriamente una justificación técnica u observación escrita.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la solicitud', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        observaciones: {
          type: 'string',
          example: 'Tarifa inconsistente en tramo del día 14/09.',
          description: 'Motivo obligatorio del rechazo u observación',
        },
      },
      required: ['observaciones'],
    },
  })
  @ApiResponse({ status: 200, description: 'Solicitud rechazada/observada con registro de motivos.', type: SolicitudPasajes })
  @ApiResponse({ status: 400, description: 'Falta la justificación escrita obligatoria.' })
  rechazarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body('observaciones') observaciones: string,
    @UsuarioActual() usuario: Usuario,
  ): Promise<SolicitudPasajes> {
    return this.pasajesServicio.rechazarSolicitud(id, usuario.id, observaciones);
  }
}
