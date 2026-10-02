import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Asistencia')
@ApiBearerAuth('JWT-auth')
@Controller('asistencia')
@UseGuards(JwtGuardia)
export class AsistenciaControlador {
  constructor(private readonly asistenciaServicio: AsistenciaServicio) {}

  @Post('ingreso')
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

  @Get()
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
