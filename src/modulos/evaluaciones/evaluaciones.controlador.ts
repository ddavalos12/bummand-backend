import { Controller, Get, Post, Body, Param, Patch, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EvaluacionesServicio } from './evaluaciones.servicio';
import { CrearEvaluacionDto } from './dtos/crear-evaluacion.dto';
import { EstadoEvaluacion, Evaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Evaluaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('evaluaciones')
export class EvaluacionesControlador {
  constructor(private readonly evaluaciones_servicio: EvaluacionesServicio) {}

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
