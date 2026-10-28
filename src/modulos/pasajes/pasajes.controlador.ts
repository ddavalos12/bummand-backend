import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PasajesServicio } from './pasajes.servicio';
import { SolicitudPasajes } from './entidades/solicitud-pasaje.entidad';
import { TarifaTransporte } from './entidades/tarifa-transporte.entidad';
import { ParadaTransporte } from './entidades/parada-transporte.entidad';
import { CrearSolicitudPasajeDto } from './dtos/crear-solicitud-pasaje.dto';
import { AgregarRecorridoDto, ItemRecorridoDto } from './dtos/agregar-recorrido.dto';
import { CrearTarifaDto } from './dtos/crear-tarifa.dto';
import { ActualizarTarifaDto } from './dtos/actualizar-tarifa.dto';
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

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('tarifas')
  @ApiOperation({
    summary: 'Catálogo de tarifas oficiales de transporte vigentes',
    description: 'Retorna las tarifas oficiales del transporte urbano regulado en La Paz y El Alto vigentes para una fecha opcional.',
  })
  @ApiQuery({ name: 'fecha', required: false, type: String, example: '2026-10-11', description: 'Fecha de referencia para validar vigencia' })
  @ApiResponse({ status: 200, description: 'Catálogo oficial de tarifas vigentes.', type: [TarifaTransporte] })
  obtenerTarifas(@Query('fecha') fecha?: string): Promise<TarifaTransporte[]> {
    return this.pasajesServicio.obtenerTarifasOficiales(fecha);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @Get('tarifas/todas')
  @ApiOperation({
    summary: 'Listado completo de tarifas (vigentes, programadas e históricas)',
    description: 'Retorna el catálogo histórico completo de tarifas para auditoría y administración.',
  })
  @ApiResponse({ status: 200, description: 'Historial completo de tarifas.', type: [TarifaTransporte] })
  listarTodasLasTarifas(): Promise<TarifaTransporte[]> {
    return this.pasajesServicio.listarTodasLasTarifas();
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post('tarifas')
  @ApiOperation({
    summary: 'Crear o promulgar nueva tarifa con vigencia temporal',
    description: 'Registra una nueva tarifa oficial con fecha de inicio de vigencia, archivando la anterior si aplica.',
  })
  @ApiResponse({ status: 201, description: 'Tarifa creada con éxito.', type: TarifaTransporte })
  crearTarifa(@Body() crearTarifaDto: CrearTarifaDto): Promise<TarifaTransporte> {
    return this.pasajesServicio.crearTarifa(crearTarifaDto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Patch('tarifas/:id')
  @ApiOperation({
    summary: 'Actualizar tarifa existente',
    description: 'Modifica los parámetros de una tarifa específica.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la tarifa', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Tarifa actualizada con éxito.', type: TarifaTransporte })
  actualizarTarifa(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarTarifaDto: ActualizarTarifaDto,
  ): Promise<TarifaTransporte> {
    return this.pasajesServicio.actualizarTarifa(id, actualizarTarifaDto);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('paradas')
  @ApiOperation({
    summary: 'Listar paradas frecuentes de transporte',
    description: 'Retorna los nodos principales y paradas habituales de transporte de La Paz y El Alto con coordenadas geodésicas, con ordenamiento opcional por cercanía GPS (Haversine).',
  })
  @ApiQuery({ name: 'ciudad', required: false, enum: ['La Paz', 'El Alto'], description: 'Filtrar por ciudad' })
  @ApiQuery({ name: 'latitud', required: false, type: Number, description: 'Latitud GPS actual para ordenar por proximidad' })
  @ApiQuery({ name: 'longitud', required: false, type: Number, description: 'Longitud GPS actual para ordenar por proximidad' })
  @ApiResponse({ status: 200, description: 'Listado de paradas frecuentes.', type: [ParadaTransporte] })
  obtenerParadas(
    @Query('ciudad') ciudad?: string,
    @Query('latitud') latitud?: number,
    @Query('longitud') longitud?: number,
  ): Promise<ParadaTransporte[]> {
    return this.pasajesServicio.obtenerParadas(ciudad, latitud, longitud);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post('paradas/sembrar')
  @ApiOperation({
    summary: 'Sembrar catálogo base de paradas oficiales',
    description: 'Inicializa o actualiza en la base de datos las paradas principales de La Paz y El Alto.',
  })
  @ApiResponse({ status: 201, description: 'Paradas sembradas exitosamente.', type: [ParadaTransporte] })
  sembrarParadas(): Promise<ParadaTransporte[]> {
    return this.pasajesServicio.sembrarParadas();
  }

  @Roles(Rol.BECARIO)
  @Get('mis-solicitudes')
  @ApiOperation({
    summary: 'Listar solicitudes de pasajes del usuario autenticado',
    description: 'Retorna el historial completo de solicitudes de viáticos declaradas por el becario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Historial de solicitudes del usuario autenticado.', type: [SolicitudPasajes] })
  obtenerMisSolicitudes(@UsuarioActual() usuario: Usuario): Promise<SolicitudPasajes[]> {
    return this.pasajesServicio.obtenerPorBecario(usuario.id);
  }

  @Roles(Rol.BECARIO)
  @Post('confirmar-datos')
  @ApiOperation({
    summary: 'Confirmar datos del becario para la declaración de pasajes',
    description: 'Registra la confirmación formal de datos personales e institucionales para el periodo indicado.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        periodo: { type: 'string', example: 'octubre 2026', description: 'Periodo mensual a confirmar' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Datos confirmados con éxito.' })
  confirmarDatos(
    @Body('periodo') periodo: string,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.pasajesServicio.confirmarDatos(usuario.id, periodo);
  }

  @Roles(Rol.BECARIO)
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

  @Roles(Rol.BECARIO)
  @Post('recorridos')
  @ApiOperation({
    summary: 'Registrar tramo de transporte diario',
    description: 'Añade un recorrido (ida o vuelta) con tarifa, origen, destino, medio de transporte y trazabilidad de calles, recalculando el 80% en centavos.',
  })
  @ApiResponse({ status: 201, description: 'Recorrido registrado y totales actualizados.' })
  agregarRecorrido(
    @Body() dto: AgregarRecorridoDto | ItemRecorridoDto | (AgregarRecorridoDto | ItemRecorridoDto)[],
    @UsuarioActual() usuario: Usuario,
  ) {
    if (Array.isArray(dto)) {
      dto.forEach((item) => {
        if (!item.becario_id) item.becario_id = usuario.id;
      });
      return this.pasajesServicio.agregarRecorridos(dto);
    }
    if (!dto.becario_id) {
      dto.becario_id = usuario.id;
    }
    return this.pasajesServicio.agregarRecorrido(dto);
  }

  @Roles(Rol.BECARIO)
  @Delete('recorridos/:id')
  @ApiOperation({
    summary: 'Eliminar tramo de transporte registrado',
    description: 'Elimina un recorrido de una solicitud editable y recalcula automáticamente los totales de la planilla.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del recorrido', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Recorrido eliminado exitosamente.' })
  @ApiResponse({ status: 400, description: 'La solicitud no es editable o no tiene autorización.' })
  @ApiResponse({ status: 404, description: 'Recorrido no encontrado.' })
  eliminarRecorrido(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.pasajesServicio.eliminarRecorrido(id, usuario.id);
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
  @Get('historial-paradas')
  @ApiOperation({
    summary: 'Consultar historial consolidado y trazabilidad de paradas de transporte',
    description: 'Retorna el historial completo consolidado de paradas y recorridos con filtros por becario, rango de fechas, tramo y actividad.',
  })
  @ApiQuery({ name: 'becario_id', required: false, type: Number, description: 'ID del becario a filtrar (opcional para admin/supervisor)' })
  @ApiQuery({ name: 'fecha_inicio', required: false, type: String, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, type: String, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'tramo', required: false, enum: ['todos', 'ida', 'vuelta'] })
  @ApiQuery({ name: 'tipo_actividad', required: false, type: String })
  @ApiQuery({ name: 'ciudad', required: false, enum: ['La Paz', 'El Alto'] })
  @ApiResponse({ status: 200, description: 'Historial consolidado de paradas.' })
  obtenerHistorialConsolidadoParadas(
    @Query('becario_id') becario_id?: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
    @Query('tramo') tramo?: string,
    @Query('tipo_actividad') tipo_actividad?: string,
    @Query('ciudad') ciudad?: string,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.pasajesServicio.obtenerHistorialConsolidadoParadas({
      becario_id: becario_id ? Number(becario_id) : undefined,
      fecha_inicio,
      fecha_fin,
      tramo,
      tipo_actividad,
      ciudad,
      usuario_autenticado: usuario,
    });
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('estudiante/:id/historial-paradas')
  @ApiOperation({
    summary: 'Recuperar historial de paradas de un estudiante en un intervalo de tiempo',
    description: 'Retorna el historial cronológico y consolidado de paradas y recorridos de un estudiante (becario), permitiendo filtrar por un rango de fechas (fecha_inicio y fecha_fin).',
  })
  @ApiParam({ name: 'id', description: 'ID del estudiante (becario) o del usuario', type: Number, example: 1 })
  @ApiQuery({ name: 'fecha_inicio', required: false, type: String, description: 'Fecha de inicio del intervalo (YYYY-MM-DD)', example: '2026-10-01' })
  @ApiQuery({ name: 'fecha_fin', required: false, type: String, description: 'Fecha de fin del intervalo (YYYY-MM-DD)', example: '2026-10-31' })
  @ApiQuery({ name: 'tramo', required: false, enum: ['todos', 'ida', 'vuelta'], description: 'Filtrar por sentido del tramo' })
  @ApiResponse({ status: 200, description: 'Historial de paradas y recorridos del estudiante en el intervalo solicitado.' })
  obtenerHistorialParadasEstudiante(
    @Param('id', ParseIntPipe) id: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
    @Query('tramo') tramo?: string,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.pasajesServicio.obtenerHistorialParadasEstudiante({
      id_estudiante: id,
      fecha_inicio,
      fecha_fin,
      tramo,
      usuario_autenticado: usuario,
    });
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id/historial-paradas')
  @ApiOperation({
    summary: 'Alias para recuperar historial de paradas por becario_id',
    description: 'Permite consultar el historial de paradas de un becario por su ID.',
  })
  @ApiParam({ name: 'becario_id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiQuery({ name: 'fecha_inicio', required: false, type: String, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, type: String, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'tramo', required: false, enum: ['todos', 'ida', 'vuelta'] })
  obtenerHistorialParadasPorBecario(
    @Param('becario_id', ParseIntPipe) becario_id: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
    @Query('tramo') tramo?: string,
    @UsuarioActual() usuario?: Usuario,
  ) {
    return this.pasajesServicio.obtenerHistorialParadasEstudiante({
      id_estudiante: becario_id,
      fecha_inicio,
      fecha_fin,
      tramo,
      usuario_autenticado: usuario,
    });
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('mis-paradas/historial')
  @ApiOperation({
    summary: 'Recuperar historial personal de paradas del estudiante en sesión',
    description: 'Permite al becario autenticado consultar su historial de paradas y recorridos con filtro de intervalo temporal.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, type: String, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, type: String, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'tramo', required: false, enum: ['todos', 'ida', 'vuelta'] })
  obtenerMiHistorialParadas(
    @UsuarioActual() usuario: Usuario,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
    @Query('tramo') tramo?: string,
  ) {
    return this.pasajesServicio.obtenerHistorialParadasEstudiante({
      id_estudiante: usuario.id,
      fecha_inicio,
      fecha_fin,
      tramo,
      usuario_autenticado: usuario,
    });
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

  @Roles(Rol.BECARIO)
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

  @Roles(Rol.BECARIO)
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
