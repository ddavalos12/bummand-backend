import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  ParseIntPipe,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { EvaluacionesServicio } from './evaluaciones.servicio';
import { CrearEvaluacionDto } from './dtos/crear-evaluacion.dto';
import { GuardarFormularioF03Dto } from './dtos/guardar-formulario-f03.dto';
import { CrearPeriodoEvaluacionDto } from './dtos/crear-periodo-evaluacion.dto';
import { ActualizarPeriodoEvaluacionDto } from './dtos/actualizar-periodo-evaluacion.dto';
import { CambiarEstadoPeriodoDto } from './dtos/cambiar-estado-periodo.dto';
import { CrearCuestionarioDto } from './dtos/crear-cuestionario.dto';
import { ActualizarCuestionarioDto } from './dtos/actualizar-cuestionario.dto';
import { CrearPreguntaCuestionarioDto } from './dtos/crear-pregunta-cuestionario.dto';
import { ActualizarPreguntaCuestionarioDto } from './dtos/actualizar-pregunta-cuestionario.dto';
import { EstadoEvaluacion, Evaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion, EstadoPeriodo } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';
import { PreguntaBienestar } from './entidades/pregunta-bienestar.entidad';
import { Cuestionario } from './entidades/cuestionario.entidad';
import { PreguntaCuestionario } from './entidades/pregunta-cuestionario.entidad';
import { ReceptorAcademicaDto } from './dtos/receptor-academica.dto';
import { GuardarNotasEstudianteDto, SubirDocumentoAcademicoDto } from './dtos/guardar-notas-estudiante.dto';
import { PreEvaluarSupervisorDto } from './dtos/pre-evaluar-supervisor.dto';
import { ConvalidarAdministracionDto } from './dtos/convalidar-administracion.dto';
import { ReceptorMentorQrDto } from './dtos/receptor-mentor-qr.dto';
import { ReceptorSocioeconomicaDto } from './dtos/receptor-socioeconomica.dto';
import { SolicitarCodigoTutorDto, VerificarCodigoTutorDto } from './dtos/verificacion-tutor.dto';
import { EntregarTareaLideresDto, RevisarEntregaLideresDto } from './dtos/escuela-lideres.dto';
import { EntregaTareaLideres } from './entidades/entrega-tarea-lideres.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

const almacenamiento_academicos = diskStorage({
  destination: (req, file, cb) => {
    const destino = path.join(process.cwd(), 'uploads', 'academicos');
    if (!fs.existsSync(destino)) {
      fs.mkdirSync(destino, { recursive: true });
    }
    cb(null, destino);
  },
  filename: (req, file, cb) => {
    const unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `academico-${unico}${ext}`);
  },
});

const almacenamiento_lideres = diskStorage({
  destination: (req, file, cb) => {
    const destino = path.join(process.cwd(), 'uploads', 'escuela-lideres');
    if (!fs.existsSync(destino)) {
      fs.mkdirSync(destino, { recursive: true });
    }
    cb(null, destino);
  },
  filename: (req, file, cb) => {
    const unico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `ceti-${unico}${ext}`);
  },
});

@ApiTags('Evaluaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('evaluaciones')
export class EvaluacionesControlador {
  constructor(private readonly evaluaciones_servicio: EvaluacionesServicio) {}

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('tutor/solicitar-codigo')
  @ApiOperation({
    summary: 'Solicitar código OTP de 6 dígitos para autorización del supervisor específico',
    description: 'Genera un código temporal de 6 dígitos y lo envía inmediatamente como notificación a la pantalla del supervisor específico asignado al becario.',
  })
  @ApiResponse({ status: 201, description: 'Código generado y notificado a la pantalla del supervisor específico.' })
  solicitarCodigoTutor(
    @Body() dto: SolicitarCodigoTutorDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.evaluaciones_servicio.solicitarCodigoTutor(dto, usuario);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('tutor/verificar-codigo')
  @ApiOperation({
    summary: 'Verificar código de autorización del supervisor específico',
    description: 'Valida el código de 6 dígitos enviado a la pantalla del supervisor específico para desbloquear el formulario de evaluación.',
  })
  @ApiResponse({ status: 200, description: 'Código de autorización del supervisor verificado con éxito.' })
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

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post('academica/estudiante')
  @ApiOperation({
    summary: 'Registro semestral de asignaturas, notas y documentos por el estudiante',
    description: 'Permite al becario ingresar manualmente sus materias, notas, kárdex, programación y carnet para pre-evaluación.',
  })
  @ApiResponse({ status: 201, description: 'Calificaciones registradas y enviadas a pre-evaluación.', type: Evaluacion })
  registrarNotasEstudiante(
    @Body() dto: GuardarNotasEstudianteDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Evaluacion> {
    return this.evaluaciones_servicio.registrarNotasEstudiante(dto, usuario);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Put('academica/:id/pre-evaluacion')
  @ApiOperation({
    summary: 'Pre-evaluación y edición de calificaciones por el supervisor',
    description: 'Permite al supervisor revisar, editar o ratificar notas antes de aprobar la pre-evaluación hacia administración.',
  })
  @ApiResponse({ status: 200, description: 'Pre-evaluación procesada con éxito.', type: Evaluacion })
  preEvaluarSupervisor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PreEvaluarSupervisorDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Evaluacion> {
    return this.evaluaciones_servicio.preEvaluarSupervisor(id, dto, usuario);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Put('academica/:id/convalidar')
  @ApiOperation({
    summary: 'Convalidación definitiva de calificaciones por administración',
    description: 'Administración convalida oficialmente el récord académico y se asienta en la sábana semestral.',
  })
  @ApiResponse({ status: 200, description: 'Calificaciones convalidadas con éxito.', type: Evaluacion })
  convalidarEvaluacionAcademica(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConvalidarAdministracionDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Evaluacion> {
    return this.evaluaciones_servicio.convalidarEvaluacionAcademica(id, dto, usuario);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('academica/becario/:becarioId/periodo/:periodoId')
  @ApiOperation({
    summary: 'Consultar registro académico y documentos de un becario por periodo',
  })
  obtenerEvaluacionAcademicaBecario(
    @Param('becarioId', ParseIntPipe) becarioId: number,
    @Param('periodoId', ParseIntPipe) periodoId: number,
  ) {
    return this.evaluaciones_servicio.obtenerEvaluacionAcademicaBecario(becarioId, periodoId);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('academica/pendientes-supervisor')
  @ApiOperation({
    summary: 'Listar evaluaciones académicas asignadas al supervisor para pre-evaluación',
  })
  obtenerPendientesSupervisor(
    @UsuarioActual() usuario: Usuario,
    @Query('periodo_id') periodo_id?: number,
  ) {
    return this.evaluaciones_servicio.obtenerPendientesSupervisor(usuario.id, periodo_id ? Number(periodo_id) : undefined);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Get('academica/pendientes-administracion')
  @ApiOperation({
    summary: 'Listar evaluaciones académicas en proceso para administración',
  })
  obtenerPendientesAdministracion(@Query('periodo_id') periodo_id?: number) {
    return this.evaluaciones_servicio.obtenerPendientesAdministracion(periodo_id ? Number(periodo_id) : undefined);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post('academica/subir-documento')
  @UseInterceptors(FileInterceptor('archivo', { storage: almacenamiento_academicos }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir Récord Académico o Historial Académico por semestre',
    description: 'Permite al estudiante o administración subir el archivo probatorio a ./uploads/academicos y pasa directamente a revisión de Administración.',
  })
  @ApiResponse({ status: 201, description: 'Documento académico subido y remitido a revisión directa de Administración.', type: Evaluacion })
  subirDocumentoAcademico(
    @Body() dto: SubirDocumentoAcademicoDto,
    @UploadedFile() archivo: any,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Evaluacion> {
    return this.evaluaciones_servicio.subirDocumentoAcademico(dto, archivo, usuario);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('modulo-3/becarios-asignados')
  @ApiOperation({
    summary: 'Listar becarios asignados al supervisor con estado de evaluación del Módulo 3',
    description: 'Retorna los becarios asignados al supervisor autenticado (o todos si es administrador) y el estado de su evaluación de prácticas/mentor.',
  })
  @ApiResponse({ status: 200, description: 'Lista de becarios asignados y estado de evaluación del Módulo 3.' })
  obtenerBecariosAsignadosModulo3(
    @UsuarioActual() usuario: Usuario,
    @Query('periodo_id') periodo_id?: number,
  ) {
    return this.evaluaciones_servicio.obtenerBecariosAsignadosModulo3(usuario, periodo_id ? Number(periodo_id) : undefined);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR, Rol.BECARIO)
  @Get('modulo-3/becario/:becarioId')
  @ApiOperation({
    summary: 'Obtener evaluación y respuestas del Módulo 3 de un becario',
    description: 'Retorna la evaluación previa del Módulo 3 y sus datos de formulario para edición y precarga.',
  })
  @ApiParam({ name: 'becarioId', description: 'ID del becario', type: Number })
  @ApiResponse({ status: 200, description: 'Evaluación y formulario del Módulo 3.' })
  obtenerEvaluacionModulo3Becario(
    @Param('becarioId', ParseIntPipe) becarioId: number,
    @Query('periodo_id') periodo_id?: number,
  ) {
    return this.evaluaciones_servicio.obtenerEvaluacionModulo3Becario(becarioId, periodo_id ? Number(periodo_id) : undefined);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('receptor/mentor-qr')
  @ApiOperation({
    summary: 'Receptor de evaluación mentor / prácticas vía QR o perfil supervisor (Módulo 3)',
    description: 'Procesa o actualiza la evaluación de prácticas/mentor validando modalidad y código de verificación.',
  })
  @ApiResponse({ status: 201, description: 'Evaluación del mentor procesada con éxito.', type: Evaluacion })
  procesarReceptorMentorQr(
    @Body() dto: ReceptorMentorQrDto,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<Evaluacion> {
    return usuario
      ? this.evaluaciones_servicio.procesarReceptorMentorQr(dto, usuario)
      : this.evaluaciones_servicio.procesarReceptorMentorQr(dto);
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

  // ==============================================================
  // GESTIÓN DINÁMICA DE CUESTIONARIOS Y EVALUACIONES
  // ==============================================================

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('cuestionarios')
  @ApiOperation({
    summary: 'Listar todos los cuestionarios e instrumentos evaluativos',
    description: 'Retorna los cuestionarios registrados con sus preguntas y metadatos.',
  })
  @ApiResponse({ status: 200, description: 'Lista de cuestionarios.', type: [Cuestionario] })
  listarCuestionarios(): Promise<Cuestionario[]> {
    return this.evaluaciones_servicio.listarCuestionarios();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('cuestionarios/:id')
  @ApiOperation({
    summary: 'Obtener cuestionario por ID con sus preguntas ordenadas',
    description: 'Retorna la configuración completa del cuestionario y sus reactivos ordenados.',
  })
  @ApiParam({ name: 'id', description: 'ID del cuestionario', type: Number })
  @ApiResponse({ status: 200, description: 'Detalle del cuestionario.', type: Cuestionario })
  obtenerCuestionario(@Param('id', ParseIntPipe) id: number): Promise<Cuestionario> {
    return this.evaluaciones_servicio.obtenerCuestionarioPorId(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post('cuestionarios')
  @ApiOperation({
    summary: 'Crear un nuevo cuestionario o instrumento evaluativo',
    description: 'Permite al administrador dar de alta un nuevo formulario o rúbrica de evaluación.',
  })
  @ApiResponse({ status: 201, description: 'Cuestionario creado exitosamente.', type: Cuestionario })
  crearCuestionario(@Body() dto: CrearCuestionarioDto): Promise<Cuestionario> {
    return this.evaluaciones_servicio.crearCuestionario(dto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Put('cuestionarios/:id')
  @ApiOperation({
    summary: 'Actualizar metadatos de un cuestionario',
    description: 'Modifica título, código, descripción o módulo asociado.',
  })
  @ApiParam({ name: 'id', description: 'ID del cuestionario', type: Number })
  @ApiResponse({ status: 200, description: 'Cuestionario actualizado.', type: Cuestionario })
  actualizarCuestionario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarCuestionarioDto,
  ): Promise<Cuestionario> {
    return this.evaluaciones_servicio.actualizarCuestionario(id, dto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Delete('cuestionarios/:id')
  @ApiOperation({
    summary: 'Eliminar un cuestionario',
    description: 'Remueve un cuestionario y en cascada todas sus preguntas asociadas.',
  })
  @ApiParam({ name: 'id', description: 'ID del cuestionario', type: Number })
  eliminarCuestionario(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.evaluaciones_servicio.eliminarCuestionario(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post('cuestionarios/:id/preguntas')
  @ApiOperation({
    summary: 'Agregar pregunta o criterio a un cuestionario',
    description: 'Añade un nuevo reactivo o criterio al cuestionario especificado.',
  })
  @ApiParam({ name: 'id', description: 'ID del cuestionario', type: Number })
  @ApiResponse({ status: 201, description: 'Pregunta agregada con éxito.', type: PreguntaCuestionario })
  agregarPregunta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearPreguntaCuestionarioDto,
  ): Promise<PreguntaCuestionario> {
    return this.evaluaciones_servicio.agregarPreguntaCuestionario(id, dto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Put('preguntas/:id')
  @ApiOperation({
    summary: 'Actualizar una pregunta existente',
    description: 'Modifica enunciado, tipo, opciones jsonb o peso de una pregunta.',
  })
  @ApiParam({ name: 'id', description: 'ID de la pregunta', type: Number })
  @ApiResponse({ status: 200, description: 'Pregunta actualizada.', type: PreguntaCuestionario })
  actualizarPregunta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPreguntaCuestionarioDto,
  ): Promise<PreguntaCuestionario> {
    return this.evaluaciones_servicio.actualizarPreguntaCuestionario(id, dto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Delete('preguntas/:id')
  @ApiOperation({
    summary: 'Eliminar una pregunta de un cuestionario',
    description: 'Remueve un reactivo o criterio específico.',
  })
  @ApiParam({ name: 'id', description: 'ID de la pregunta', type: Number })
  eliminarPregunta(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.evaluaciones_servicio.eliminarPreguntaCuestionario(id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post('cuestionarios/sembrar')
  @ApiOperation({
    summary: 'Sembrar cuestionarios base del sistema',
    description: 'Inicializa los cuestionarios reglamentarios (Bienestar, F-03, Mentor) si faltan en la base de datos.',
  })
  async sembrarCuestionarios(): Promise<{ mensaje: string }> {
    await this.evaluaciones_servicio.sembrarCuestionariosBase();
    return { mensaje: 'Cuestionarios e instrumentos base sembrados exitosamente.' };
  }

  // ==============================================================
  // ESCUELA DE LÍDERES CETI (MÓDULO 4) - PATRÓN CLASSROOM
  // ==============================================================

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('escuela-lideres/tareas')
  @ApiOperation({
    summary: 'Listar las 12 tareas CETI y estado de entrega del becario',
    description: 'Retorna las 12 tareas formativas del semestre y el estado de entrega y calificación del becario.',
  })
  @ApiQuery({ name: 'becario_id', required: false, description: 'ID del becario (opcional para supervisor/admin)' })
  @ApiQuery({ name: 'periodo_id', required: false, description: 'ID del periodo académico' })
  obtenerTareasEscuelaLideres(
    @UsuarioActual() usuario: Usuario,
    @Query('becario_id') becario_id?: number,
    @Query('periodo_id') periodo_id?: number,
  ) {
    return this.evaluaciones_servicio.obtenerTareasEscuelaLideres(
      usuario,
      becario_id ? Number(becario_id) : undefined,
      periodo_id ? Number(periodo_id) : undefined,
    );
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post('escuela-lideres/tareas/subir-evidencia')
  @UseInterceptors(FileInterceptor('archivo', { storage: almacenamiento_lideres }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir evidencia documental de tarea de Escuela de Líderes',
    description: 'Almacena el archivo en ./uploads/escuela-lideres y retorna la URL.',
  })
  subirEvidenciaLideres(@UploadedFile() archivo: any) {
    if (!archivo) {
      throw new BadRequestException('Se requiere adjuntar un archivo de evidencia');
    }
    const url = `/uploads/escuela-lideres/${archivo.filename}`;
    return {
      url,
      archivo_evidencia_url: url,
      nombre_archivo: archivo.originalname,
      tamano_archivo: `${(archivo.size / 1024).toFixed(1)} KB`,
    };
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post('escuela-lideres/tareas/entregar')
  @ApiOperation({
    summary: 'Entregar tarea de Escuela de Líderes CETI',
    description: 'Registra la entrega de informe práctico con evidencia adjunta y comentario del becario.',
  })
  @ApiResponse({ status: 201, description: 'Tarea entregada con éxito.', type: EntregaTareaLideres })
  entregarTareaLideres(
    @Body() dto: EntregarTareaLideresDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<EntregaTareaLideres> {
    return this.evaluaciones_servicio.entregarTareaEscuelaLideres(dto, usuario);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch('escuela-lideres/entregas/:id/revisar')
  @ApiOperation({
    summary: 'Revisar y calificar entrega de tarea CETI',
    description: 'El supervisor o facilitador califica la tarea (revisado/observado) y se recalcula automáticamente la nota del Módulo 4.',
  })
  @ApiParam({ name: 'id', description: 'ID de la entrega a calificar', type: Number })
  revisarEntregaLideres(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevisarEntregaLideresDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.evaluaciones_servicio.revisarEntregaEscuelaLideres(id, dto, usuario);
  }
}
