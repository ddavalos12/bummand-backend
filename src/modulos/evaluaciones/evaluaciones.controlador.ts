import { Controller, Get, Post, Put, Body, Param, Patch, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EvaluacionesServicio } from './evaluaciones.servicio';
import { CrearEvaluacionDto } from './dtos/crear-evaluacion.dto';
import { GuardarFormularioF03Dto } from './dtos/guardar-formulario-f03.dto';
import { CrearPeriodoEvaluacionDto } from './dtos/crear-periodo-evaluacion.dto';
import { ActualizarPeriodoEvaluacionDto } from './dtos/actualizar-periodo-evaluacion.dto';
import { CambiarEstadoPeriodoDto } from './dtos/cambiar-estado-periodo.dto';
import { EstadoEvaluacion, Evaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion, EstadoPeriodo } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';
import { PreguntaBienestar } from './entidades/pregunta-bienestar.entidad';
import { ReceptorAcademicaDto } from './dtos/receptor-academica.dto';
import { ReceptorMentorQrDto } from './dtos/receptor-mentor-qr.dto';
import { ReceptorSocioeconomicaDto } from './dtos/receptor-socioeconomica.dto';
import { SolicitarCodigoTutorDto, VerificarCodigoTutorDto } from './dtos/verificacion-tutor.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Evaluaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('evaluaciones')
export class EvaluacionesControlador {
  constructor(private readonly evaluaciones_servicio: EvaluacionesServicio) {}

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('tutor/solicitar-codigo')
  @ApiOperation({
    summary: 'Solicitar código OTP de 6 dígitos para verificación del Supervisor/Tutor',
    description: 'Genera un código temporal de 6 dígitos y lo envía inmediatamente como notificación a la pantalla del Supervisor asignado.',
  })
  @ApiResponse({ status: 201, description: 'Código generado y notificado a la pantalla del supervisor.' })
  solicitarCodigoTutor(
    @Body() dto: SolicitarCodigoTutorDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.evaluaciones_servicio.solicitarCodigoTutor(dto, usuario);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('tutor/verificar-codigo')
  @ApiOperation({
    summary: 'Verificar identidad del Supervisor/Tutor mediante código de notificación o credenciales',
    description: 'Valida el código de 6 dígitos enviado a la pantalla del supervisor o sus credenciales institucionales para desbloquear el formulario de evaluación.',
  })
  @ApiResponse({ status: 200, description: 'Identidad del supervisor verificada con éxito.' })
  verificarCodigoTutor(@Body() dto: VerificarCodigoTutorDto) {
    return this.evaluaciones_servicio.verificarCodigoTutor(dto);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('receptor/academica')
  @ApiOperation({
    summary: 'Receptor de autoevaluación académica (Módulo 2)',
    description: 'Recibe promedio académico, materias, récord/historial académico y respuestas del becario.',
  })
  @ApiResponse({ status: 201, description: 'Autoevaluación académica procesada con éxito.', type: Evaluacion })
  procesarReceptorAcademica(@Body() dto: ReceptorAcademicaDto): Promise<Evaluacion> {
    return this.evaluaciones_servicio.procesarReceptorAcademica(dto);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('receptor/mentor-qr')
  @ApiOperation({
    summary: 'Receptor de evaluación mentor / prácticas vía QR (Módulo 3)',
    description: 'Procesa respuestas de rúbrica Likert enviadas por el mentor o supervisor de prácticas.',
  })
  @ApiResponse({ status: 201, description: 'Evaluación del mentor procesada con éxito.', type: Evaluacion })
  procesarReceptorMentorQr(@Body() dto: ReceptorMentorQrDto): Promise<Evaluacion> {
    return this.evaluaciones_servicio.procesarReceptorMentorQr(dto);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('receptor/socioeconomica')
  @ApiOperation({
    summary: 'Receptor de evaluación socioeconómica (Módulo 5)',
    description: 'Procesa datos del formulario socioeconómico y asigna el semáforo de vulnerabilidad.',
  })
  @ApiResponse({ status: 201, description: 'Evaluación socioeconómica procesada con éxito.', type: Evaluacion })
  procesarReceptorSocioeconomica(@Body() dto: ReceptorSocioeconomicaDto): Promise<Evaluacion> {
    return this.evaluaciones_servicio.procesarReceptorSocioeconomica(dto);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('cuestionario-bienestar')
  @ApiOperation({
    summary: 'Obtener cuestionario de bienestar universitario (26 preguntas)',
    description: 'Retorna las 26 preguntas oficiales ordenadas. Si la tabla está vacía, se inicializa automáticamente.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de preguntas de bienestar.', type: [PreguntaBienestar] })
  obtenerCuestionarioBienestar(): Promise<PreguntaBienestar[]> {
    return this.evaluaciones_servicio.obtenerCuestionarioBienestar();
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @Put('cuestionario-bienestar')
  @ApiOperation({
    summary: 'Actualizar o personalizar cuestionario de bienestar universitario',
    description: 'Permite a la institución modificar enunciados, incisos, puntajes o añadir preguntas.',
  })
  @ApiResponse({ status: 200, description: 'Cuestionario actualizado con éxito.', type: [PreguntaBienestar] })
  actualizarCuestionarioBienestar(@Body() payload: any): Promise<PreguntaBienestar[]> {
    return this.evaluaciones_servicio.actualizarCuestionarioBienestar(payload);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('consolidado-semestral')
  @ApiOperation({
    summary: 'Obtener consolidado y matriz semestral de evaluaciones',
    description: 'Retorna los criterios oficiales (23.jpeg), rangos de aprobación y la nómina completa de 21 becarios con notas y comentarios de Evaluacion_semestre_II.',
  })
  @ApiResponse({ status: 200, description: 'Consolidado semestral obtenido con éxito.' })
  obtenerConsolidadoSemestral(@Query('periodo') periodo?: string) {
    return this.evaluaciones_servicio.obtenerConsolidadoSemestral(periodo);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post()
  @ApiOperation({
    summary: 'Registrar evaluación de módulo',
    description: 'Registra la calificación y observaciones cualitativas para uno de los 5 módulos formativos.',
  })
  @ApiResponse({ status: 201, description: 'Evaluación registrada con éxito.', type: Evaluacion })
  crear(@Body() crear_dto: CrearEvaluacionDto) {
    return this.evaluaciones_servicio.crear(crear_dto);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get()
  @ApiOperation({
    summary: 'Listar todas las evaluaciones',
    description: 'Retorna todas las evaluaciones semestrales registradas en el sistema.',
  })
  @ApiResponse({ status: 200, description: 'Listado de evaluaciones.', type: [Evaluacion] })
  obtenerTodas() {
    return this.evaluaciones_servicio.obtenerTodas();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id')
  @ApiOperation({
    summary: 'Listar evaluaciones de un becario',
    description: 'Retorna las calificaciones por módulo asociadas a un becario específico.',
  })
  @ApiParam({ name: 'becario_id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Evaluaciones del becario.', type: [Evaluacion] })
  obtenerPorBecario(@Param('becario_id', ParseIntPipe) becario_id: number) {
    return this.evaluaciones_servicio.obtenerPorBecario(becario_id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id/periodo/:periodo_id/calificacion-total')
  @ApiOperation({
    summary: 'Calcular Calificación Total Ponderada 360°',
    description: 'Calcula la nota global ponderada sobre 100 puntos y su escala vigesimal (0-20 pts) según los pesos de los 5 módulos canónicos.',
  })
  @ApiParam({ name: 'becario_id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiParam({ name: 'periodo_id', description: 'Identificador del periodo académico', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Calificación ponderada consolidada.',
    schema: {
      example: {
        becario_id: 1,
        periodo_id: 1,
        total_porcentual: 88.5,
        total_vigesimal: 17.7,
        desglose_modulos: [],
      },
    },
  })
  calcularCalificacionTotal(
    @Param('becario_id', ParseIntPipe) becario_id: number,
    @Param('periodo_id', ParseIntPipe) periodo_id: number,
  ) {
    return this.evaluaciones_servicio.calcularCalificacionTotal(becario_id, periodo_id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id/periodo/:periodo_id/seguimiento')
  @ApiOperation({
    summary: 'Obtener seguimiento evaluativo y cita bíblica inspiracional',
    description: 'Devuelve la calificación ponderada dinámica semestral, desglose de notas y pasaje bíblico diario.',
  })
  @ApiParam({ name: 'becario_id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiParam({ name: 'periodo_id', description: 'Identificador del periodo académico', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Seguimiento con cita bíblica obtenido con éxito.' })
  obtenerSeguimiento(
    @Param('becario_id', ParseIntPipe) becario_id: number,
    @Param('periodo_id', ParseIntPipe) periodo_id: number,
  ) {
    return this.evaluaciones_servicio.obtenerSeguimiento(becario_id, periodo_id);
  }

  // ==============================================================
  // GESTIÓN DE CASOS DE SEGUIMIENTO PASTORAL Y MENTORÍA
  // ==============================================================

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('casos-pastorales')
  @ApiOperation({
    summary: 'Listar casos de seguimiento pastoral y mentoría',
    description: 'Devuelve los casos de becarios que requieren tutoría pastoral, con estados (PENDIENTE, EN_TUTORIA, RESUELTO).',
  })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado (todos, PENDIENTE, EN_TUTORIA, RESUELTO)' })
  @ApiQuery({ name: 'becario_id', required: false, description: 'Filtrar por ID de becario' })
  obtenerCasosPastorales(
    @Query('estado') estado?: string,
    @Query('becario_id') becario_id?: number,
  ) {
    return this.evaluaciones_servicio.obtenerCasosPastorales({
      estado,
      becario_id: becario_id ? Number(becario_id) : undefined,
    });
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('casos-pastorales')
  @ApiOperation({
    summary: 'Registrar un nuevo caso de seguimiento pastoral',
    description: 'Permite a la coordinación o tutor crear un expediente de acompañamiento pastoral o derivado de F-03.',
  })
  crearCasoPastoral(
    @Body()
    dto: {
      becario_id: number;
      observacion_pastoral: string;
      origen?: string;
      prioridad?: any;
      plan_accion?: string;
      responsable_nombre?: string;
    },
  ) {
    return this.evaluaciones_servicio.crearCasoPastoral(dto);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Put('casos-pastorales/:id/gestionar')
  @ApiOperation({
    summary: 'Actualizar plan de acción, estado o registrar avance en caso pastoral',
  })
  gestionarCasoPastoral(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      plan_accion?: string;
      estado?: any;
      prioridad?: any;
      responsable_nombre?: string;
      nueva_nota?: { autor: string; rol_autor: string; contenido: string; acuerdos?: string };
    },
  ) {
    return this.evaluaciones_servicio.gestionarCasoPastoral(id, dto);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('casos-pastorales/:id/resolver')
  @ApiOperation({
    summary: 'Dar por superado y resolver caso de seguimiento pastoral',
  })
  resolverCasoPastoral(
    @Param('id', ParseIntPipe) id: number,
    @Body('conclusion') conclusion: string,
  ) {
    return this.evaluaciones_servicio.resolverCasoPastoral(id, conclusion);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener evaluación por ID',
    description: 'Consulta los datos detallados de una evaluación específica y su formulario anexo.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la evaluación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle de la evaluación.', type: Evaluacion })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.evaluaciones_servicio.obtenerPorId(id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Cambiar estado de una evaluación',
    description: 'Actualiza el estado de la evaluación (pendiente, completada, observada).',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la evaluación', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          enum: Object.values(EstadoEvaluacion),
          example: 'completada',
        },
      },
      required: ['estado'],
    },
  })
  @ApiResponse({ status: 200, description: 'Estado actualizado.', type: Evaluacion })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: EstadoEvaluacion,
  ) {
    return this.evaluaciones_servicio.cambiarEstado(id, estado);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post(':id/formulario-f03')
  @ApiOperation({
    summary: 'Registrar o actualizar el Formulario F-03 Pastoral',
    description: 'Guarda las respuestas cualitativas, datos del pastor e iglesia local, y opcionalmente califica la evaluación pastoral.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la evaluación principal (Módulo 1)', type: Number, example: 1 })
  @ApiResponse({ status: 201, description: 'Formulario F-03 guardado con éxito.', type: EvaluacionPastor })
  registrarFormularioF03(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GuardarFormularioF03Dto,
  ): Promise<EvaluacionPastor> {
    return this.evaluaciones_servicio.registrarFormularioF03(id, dto);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get(':id/formulario-f03')
  @ApiOperation({
    summary: 'Obtener Formulario F-03 Pastoral por ID de evaluación',
    description: 'Recupera el formulario de evaluación ministerial eclesial anexo al becario.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la evaluación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle del Formulario F-03.', type: EvaluacionPastor })
  obtenerFormularioF03(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EvaluacionPastor> {
    return this.evaluaciones_servicio.obtenerFormularioF03(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post('periodos')
  @ApiOperation({
    summary: 'Crear nuevo periodo semestral de evaluación',
    description: 'Crea un nuevo semestre con ponderaciones porcentuales dinámicas para los 5 módulos (suma debe ser 100).',
  })
  @ApiResponse({ status: 201, description: 'Periodo creado exitosamente.', type: PeriodoEvaluacion })
  @ApiResponse({ status: 400, description: 'La suma de pesos porcentuales no equivale al 100%.' })
  crearPeriodo(@Body() dto: CrearPeriodoEvaluacionDto): Promise<PeriodoEvaluacion> {
    return this.evaluaciones_servicio.crearPeriodo(dto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Put('periodos/:id')
  @ApiOperation({
    summary: 'Actualizar configuración o pesos de un periodo semestral',
    description: 'Modifica los porcentajes o fechas del periodo asegurando que la suma sea 100%.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del periodo académico', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Periodo actualizado exitosamente.', type: PeriodoEvaluacion })
  actualizarPeriodo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPeriodoEvaluacionDto,
  ): Promise<PeriodoEvaluacion> {
    return this.evaluaciones_servicio.actualizarPeriodo(id, dto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Put('periodos/:id/estado')
  @ApiOperation({
    summary: 'Aperturar o cerrar semestre de evaluación (PUT)',
    description: 'Permite al administrador abrir o cerrar un periodo semestral de evaluaciones (abierto / cerrado).',
  })
  @ApiParam({ name: 'id', description: 'Identificador del periodo académico', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Estado del periodo actualizado.', type: PeriodoEvaluacion })
  actualizarEstadoPeriodo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoPeriodoDto,
  ): Promise<PeriodoEvaluacion> {
    return this.evaluaciones_servicio.cambiarEstadoPeriodo(id, dto.estado);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch('periodos/:id/estado')
  @ApiOperation({
    summary: 'Cambiar estado de un periodo de evaluación (Patch)',
    description: 'Permite abrir o cerrar un periodo semestral de evaluaciones (abierto / cerrado).',
  })
  @ApiParam({ name: 'id', description: 'Identificador del periodo académico', type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          enum: Object.values(EstadoPeriodo),
          example: 'cerrado',
        },
      },
      required: ['estado'],
    },
  })
  @ApiResponse({ status: 200, description: 'Estado del periodo actualizado.', type: PeriodoEvaluacion })
  cambiarEstadoPeriodo(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: EstadoPeriodo,
  ): Promise<PeriodoEvaluacion> {
    return this.evaluaciones_servicio.cambiarEstadoPeriodo(id, estado);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch('catalogos/periodos/:id/estado')
  @ApiOperation({
    summary: 'Cambiar estado de un periodo (alias catálogo)',
    description: 'Ruta alternativa para compatibilidad con paneles de administración.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del periodo académico', type: Number, example: 1 })
  cambiarEstadoPeriodoCatalogo(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: EstadoPeriodo,
  ): Promise<PeriodoEvaluacion> {
    return this.evaluaciones_servicio.cambiarEstadoPeriodo(id, estado);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('catalogos/modulos')
  @ApiOperation({
    summary: 'Listar catálogo de módulos evaluativos',
    description: 'Retorna los 5 módulos oficiales: Liderazgo F-03, Académica, Mentor, Escuela de Líderes y Socioeconómica.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de módulos.', type: [ModuloEvaluacion] })
  listarModulos() {
    return this.evaluaciones_servicio.listarModulos();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('catalogos/periodos')
  @ApiOperation({
    summary: 'Listar periodos académicos',
    description: 'Retorna los semestres académicos vigentes (ej. 2026-I, 2026-II).',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de periodos.', type: [PeriodoEvaluacion] })
  listarPeriodos() {
    return this.evaluaciones_servicio.listarPeriodos();
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('catalogos/evaluadores')
  @ApiOperation({
    summary: 'Listar tipos de evaluadores',
    description: 'Retorna el catálogo de evaluadores habilitados (pastor, supervisor, facilitador, etc.).',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de evaluadores.', type: [Evaluador] })
  listarEvaluadores() {
    return this.evaluaciones_servicio.listarEvaluadores();
  }
}
