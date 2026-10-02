import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PracticasServicio } from './practicas.servicio';
import { CrearAprobacionDto } from './dtos/crear-aprobacion.dto';
import { AprobacionPracticas } from './entidades/aprobacion-practicas.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Prácticas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('practicas')
export class PracticasControlador {
  constructor(private readonly servicio: PracticasServicio) {}

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('aprobaciones')
  @ApiOperation({
    summary: 'Convalidar y certificar horas de práctica',
    description: 'Registra la aprobación formal del mes de prácticas junto con la firma digitalizada manuscrita del supervisor.',
  })
  @ApiResponse({ status: 201, description: 'Horas certificadas con éxito.', type: AprobacionPracticas })
  crear(@Body() dto: CrearAprobacionDto, @UsuarioActual() usuario: Usuario) {
    return this.servicio.crear(dto, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('aprobaciones')
  @ApiOperation({
    summary: 'Listar aprobaciones de prácticas',
    description: 'Retorna todas las certificaciones mensuales de prácticas emitidas.',
  })
  @ApiResponse({ status: 200, description: 'Certificaciones obtenidas.', type: [AprobacionPracticas] })
  listar() {
    return this.servicio.listar();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('aprobaciones/becario/:becario_id')
  @ApiOperation({
    summary: 'Listar certificaciones de un becario',
    description: 'Retorna las convalidaciones de horas de un estudiante en particular.',
  })
  @ApiParam({ name: 'becario_id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Certificaciones del becario.', type: [AprobacionPracticas] })
  obtenerPorBecario(@Param('becario_id', ParseIntPipe) becario_id: number) {
    return this.servicio.obtenerPorBecario(becario_id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('aprobaciones/:id')
  @ApiOperation({
    summary: 'Obtener certificación por ID',
    description: 'Consulta los metadatos y la firma digital de una certificación específica.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la aprobación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle de la aprobación.', type: AprobacionPracticas })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtenerPorId(id);
  }
}
