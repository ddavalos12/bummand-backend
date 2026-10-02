import { Controller, Get, Post, Body, Param, Patch, ParseIntPipe, UseGuards } from '@nestjs/common';
import { EvaluacionesServicio } from './evaluaciones.servicio';
import { CrearEvaluacionDto } from './dtos/crear-evaluacion.dto';
import { EstadoEvaluacion } from './entidades/evaluacion.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@UseGuards(JwtGuardia, RolesGuardia)
@Controller('evaluaciones')
export class EvaluacionesControlador {
  constructor(private readonly evaluaciones_servicio: EvaluacionesServicio) {}

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post()
  crear(@Body() crear_dto: CrearEvaluacionDto) {
    return this.evaluaciones_servicio.crear(crear_dto);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get()
  obtenerTodas() {
    return this.evaluaciones_servicio.obtenerTodas();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id')
  obtenerPorBecario(@Param('becario_id', ParseIntPipe) becario_id: number) {
    return this.evaluaciones_servicio.obtenerPorBecario(becario_id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id/periodo/:periodo_id/calificacion-total')
  calcularCalificacionTotal(
    @Param('becario_id', ParseIntPipe) becario_id: number,
    @Param('periodo_id', ParseIntPipe) periodo_id: number,
  ) {
    return this.evaluaciones_servicio.calcularCalificacionTotal(becario_id, periodo_id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.evaluaciones_servicio.obtenerPorId(id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: EstadoEvaluacion,
  ) {
    return this.evaluaciones_servicio.cambiarEstado(id, estado);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('catalogos/modulos')
  listarModulos() {
    return this.evaluaciones_servicio.listarModulos();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('catalogos/periodos')
  listarPeriodos() {
    return this.evaluaciones_servicio.listarPeriodos();
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('catalogos/evaluadores')
  listarEvaluadores() {
    return this.evaluaciones_servicio.listarEvaluadores();
  }
}
