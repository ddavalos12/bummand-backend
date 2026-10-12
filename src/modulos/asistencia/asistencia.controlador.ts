import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { Multa } from './entidades/multa.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';
import { ConfirmarOrganizadorDto } from './dtos/confirmar-organizador.dto';
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

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Listar registros de asistencia',
    description: 'Retorna el historial consolidado de marcaciones de asistencia, coordenadas de entrada/salida y horas calculadas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de registros de asistencia.',
    type: [RegistroAsistencia],
  })
  obtenerTodos(): Promise<RegistroAsistencia[]> {
    return this.asistenciaServicio.obtenerTodos();
  }
}
