import { Controller, Get, Post, Patch, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { Multa } from './entidades/multa.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';
import { ConfirmarOrganizadorDto } from './dtos/confirmar-organizador.dto';
import { RegistrarAsistenciaManualDto } from './dtos/registrar-asistencia-manual.dto';
import { RectificarAsistenciaDto } from './dtos/rectificar-asistencia.dto';
import { RevisarSupervisorAsistenciaDto, AprobarAdminAsistenciaDto } from './dtos/revisar-asistencia.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Asistencia')
@ApiBearerAuth('JWT-auth')
@Controller('asistencia')
@UseGuards(JwtGuardia, RolesGuardia)
export class AsistenciaControlador {
  constructor(private readonly asistenciaServicio: AsistenciaServicio) {}

  @Post('ingreso')
  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Registrar marcación de ingreso',
    description: 'Valida mediante la fórmula de Haversine que el becario se encuentre dentro del radio de tolerancia de su sede asignada y registra la hora de entrada.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ingreso registrado satisfactoriamente dentro de la geocerca.',
    type: RegistroAsistencia,
  })
  @ApiResponse({
    status: 400,
    description: 'Fuera del radio de tolerancia geodésica, ubicación simulada detectada o ya existe marcación previa.',
  })
  registrarIngreso(@Body() coordenadasDto: CoordenadasDto, @UsuarioActual() usuario: Usuario) {
    coordenadasDto.becario_id = usuario.id;
    return this.asistenciaServicio.registrarIngreso(coordenadasDto);
  }

  @Post('salida')
  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Registrar marcación de salida',
    description: 'Verifica la ubicación satelital actual del becario, calcula las horas cronológicas efectivas trabajadas y cierra la jornada.',
  })
  @ApiResponse({
    status: 201,
    description: 'Salida registrada satisfactoriamente y horas computadas.',
    type: RegistroAsistencia,
  })
  @ApiResponse({
    status: 400,
    description: 'No existe ingreso previo para hoy o la posición se encuentra fuera de rango.',
  })
  registrarSalida(@Body() coordenadasDto: CoordenadasDto, @UsuarioActual() usuario: Usuario) {
    coordenadasDto.becario_id = usuario.id;
    return this.asistenciaServicio.registrarSalida(coordenadasDto);
  }

  @Post('confirmar-organizador')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Llamar lista o confirmar presencia física en lote',
    description: 'Permite al organizador o supervisor confirmar formalmente la asistencia presencial de los becarios.',
  })
  @ApiResponse({ status: 200, description: 'Asistencia(s) confirmada(s) con éxito.' })
  confirmarOrganizador(@Body() dto: ConfirmarOrganizadorDto) {
    return this.asistenciaServicio.confirmarOrganizador(dto);
  }

  @Post('manual')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Registrar marcación manual por contingencia',
    description: 'Permite al administrador o supervisor asentar una asistencia cuando el becario no dispuso de megas o no pudo marcar.',
  })
  @ApiResponse({
    status: 201,
    description: 'Asistencia manual registrada satisfactoriamente.',
    type: RegistroAsistencia,
  })
  registrarManual(@Body() dto: RegistrarAsistenciaManualDto) {
    return this.asistenciaServicio.registrarAsistenciaManual(dto);
  }

  @Patch(':id/rectificar-hora')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Rectificar hora de llegada y justificar retraso (Solo Administrador)',
    description: 'Permite exclusivamente al Administrador corregir la hora de llegada, anular minutos de retraso y multas, y registrar automáticamente la justificación institucional aprobada.',
  })
  @ApiParam({ name: 'id', description: 'ID del registro de asistencia', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Asistencia rectificada y justificada satisfactoriamente.',
    type: RegistroAsistencia,
  })
  rectificarHora(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RectificarAsistenciaDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.asistenciaServicio.rectificarHoraYJustificar(id, dto, usuario?.id);
  }

  @Patch(':id/revisar-supervisor')
  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Revisión y validación de asistencia por el supervisor',
    description: 'Permite al supervisor revisar la marcación de asistencia del becario y emitir observaciones.',
  })
  @ApiParam({ name: 'id', description: 'ID del registro de asistencia', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Asistencia revisada por el supervisor.', type: RegistroAsistencia })
  revisarSupervisor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevisarSupervisorAsistenciaDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.asistenciaServicio.revisarSupervisor(id, dto, usuario.id);
  }

  @Patch(':id/aprobar-administracion')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Aprobación definitiva de asistencia por administración',
    description: 'Dictamina la aprobación formal o convalidación final de la marcación de asistencia.',
  })
  @ApiParam({ name: 'id', description: 'ID del registro de asistencia', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Asistencia aprobada por administración.', type: RegistroAsistencia })
  aprobarAdministracion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarAdminAsistenciaDto,
    @UsuarioActual() usuario: Usuario,
  ) {
    return this.asistenciaServicio.aprobarAdministracion(id, dto, usuario.id);
  }

  @Get('multas')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Listar multas institucionales por retraso',
    description: 'Retorna todas las multas acumuladas por retrasos en Escuela de Líderes u otros eventos.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de multas aplicadas.', type: [Multa] })
  obtenerMultas(): Promise<Multa[]> {
    return this.asistenciaServicio.obtenerMultas();
  }

  @Get('multas/mis-multas')
  @Roles(Rol.BECARIO)
  @ApiOperation({
    summary: 'Consultar multas del becario autenticado',
    description: 'Retorna las multas institucionales registradas en el expediente del becario en sesión.',
  })
  @ApiResponse({ status: 200, description: 'Listado personal de multas.', type: [Multa] })
  obtenerMisMultas(@UsuarioActual() usuario: Usuario): Promise<Multa[]> {
    return this.asistenciaServicio.obtenerMisMultas(usuario.id);
  }

  @Get('mis-asistencias')
  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Consultar asistencias del becario autenticado',
    description: 'Retorna el historial de marcaciones del becario en sesión.',
  })
  @ApiResponse({ status: 200, description: 'Listado personal de asistencias.', type: [RegistroAsistencia] })
  obtenerMisAsistencias(
    @UsuarioActual() usuario: Usuario,
    @Query('becario_id') becario_id?: number,
  ): Promise<RegistroAsistencia[]> {
    return this.asistenciaServicio.obtenerPorUsuario(usuario.id, becario_id);
  }

  @Get('horas-mensuales')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Resumen de horas mensuales trabajadas por becario',
    description: 'Devuelve el resumen de horas acumuladas por mes para cada becario y el total acumulado en el mes actual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen consolidado de horas trabajadas por mes.',
  })
  obtenerHorasMensuales() {
    return this.asistenciaServicio.obtenerHorasMensuales();
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Listar registros de asistencia',
    description: 'Retorna el historial consolidado de marcaciones de asistencia. Si el usuario autenticado es becario, filtra automáticamente sus registros para evitar error 403 Forbidden.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de registros de asistencia.',
    type: [RegistroAsistencia],
  })
  obtenerTodos(
    @UsuarioActual() usuario: Usuario,
    @Query('becario_id') becario_id?: number,
    @Query('tipo') tipo?: string,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ): Promise<RegistroAsistencia[]> {
    if (usuario && usuario.rol === Rol.BECARIO) {
      return this.asistenciaServicio.obtenerPorUsuario(usuario.id, becario_id);
    }
    if (becario_id) {
      return this.asistenciaServicio.obtenerPorUsuario(usuario?.id, becario_id);
    }
    return this.asistenciaServicio.obtenerTodos({
      tipo,
      fecha_inicio,
      fecha_fin,
      becario_id,
    });
  }
}
