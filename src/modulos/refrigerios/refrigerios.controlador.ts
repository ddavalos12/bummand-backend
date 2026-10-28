import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RefrigeriosServicio, PlanillaReposicionRefrigerio } from './refrigerios.servicio';
import { CrearRefrigerioDto } from './dtos/crear-refrigerio.dto';
import { ActualizarRefrigerioDto } from './dtos/actualizar-refrigerio.dto';
import { Refrigerio } from './entidades/refrigerio.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Refrigerios')
@ApiBearerAuth('JWT-auth')
@Controller('refrigerios')
@UseGuards(JwtGuardia, RolesGuardia)
export class RefrigeriosControlador {
  constructor(private readonly refrigerios_servicio: RefrigeriosServicio) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Registrar nueva rendición o suministro de refrigerio',
    description: 'Registra los gastos y distribución de raciones para eventos o sedes operativas.',
  })
  @ApiResponse({ status: 201, description: 'Refrigerio registrado exitosamente.', type: Refrigerio })
  crear(@Body() dto: CrearRefrigerioDto): Promise<Refrigerio> {
    return this.refrigerios_servicio.crear(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Listar registros de refrigerios institucionales',
    description: 'Retorna el catálogo completo de consumos y gastos en refrigerios con sus responsables.',
  })
  @ApiResponse({ status: 200, description: 'Listado de refrigerios.', type: [Refrigerio] })
  listar(): Promise<Refrigerio[]> {
    return this.refrigerios_servicio.listar();
  }

  @Get('planilla-reposicion/:id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Emitir planilla institucional de reposición de refrigerio',
    description: 'Genera el resumen oficial institucional para el trámite de reembolso y reposición de fondos.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del refrigerio', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Planilla de reposición emitida satisfactoriamente.' })
  generarPlanillaReposicion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlanillaReposicionRefrigerio> {
    return this.refrigerios_servicio.generarPlanillaReposicion(id);
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Obtener detalle de un refrigerio por ID',
    description: 'Consulta los montos, raciones, registros de conformidad en sistema y contexto del refrigerio.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del refrigerio', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle del refrigerio.', type: Refrigerio })
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<Refrigerio> {
    return this.refrigerios_servicio.obtenerPorId(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Actualizar rendición de refrigerio',
    description: 'Modifica datos de raciones, costos o registros de conformidad en sistema de un refrigerio.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del refrigerio', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Refrigerio actualizado exitosamente.', type: Refrigerio })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarRefrigerioDto,
  ): Promise<Refrigerio> {
    return this.refrigerios_servicio.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Eliminar registro de refrigerio',
    description: 'Remueve un registro de refrigerio del sistema institucional (Solo Administradores).',
  })
  @ApiParam({ name: 'id', description: 'Identificador del refrigerio', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Registro eliminado exitosamente.' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.refrigerios_servicio.eliminar(id);
  }
}
