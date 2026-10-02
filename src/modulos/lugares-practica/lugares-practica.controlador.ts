import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LugaresPracticaServicio } from './lugares-practica.servicio';
import { CrearLugarPracticaDto } from './dtos/crear-lugar-practica.dto';
import { ActualizarLugarPracticaDto } from './dtos/actualizar-lugar-practica.dto';
import { LugarPractica } from './entidades/lugar-practica.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Lugares de Práctica')
@ApiBearerAuth('JWT-auth')
@Controller('lugares-practica')
@UseGuards(JwtGuardia, RolesGuardia)
export class LugaresPracticaControlador {
  constructor(private readonly servicio: LugaresPracticaServicio) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar nueva sede o lugar de práctica',
    description: 'Crea una sede institucional con coordenadas geográficas WGS84 y radio de tolerancia para geocercas.',
  })
  @ApiResponse({ status: 201, description: 'Sede registrada exitosamente.', type: LugarPractica })
  crear(@Body() dto: CrearLugarPracticaDto): Promise<LugarPractica> {
    return this.servicio.crear(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Listar lugares de práctica',
    description: 'Retorna todas las agencias, sucursales y sedes operativas registradas con sus coordenadas.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de sedes.', type: [LugarPractica] })
  listar(): Promise<LugarPractica[]> {
    return this.servicio.listar();
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Obtener lugar de práctica por ID',
    description: 'Consulta los parámetros geoespaciales y detalles de una sede específica.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la sede', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle de la sede.', type: LugarPractica })
  @ApiResponse({ status: 404, description: 'Sede no encontrada.' })
  obtener(@Param('id', ParseIntPipe) id: number): Promise<LugarPractica> {
    return this.servicio.obtener(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar parámetros de una sede',
    description: 'Modifica las coordenadas WGS84, dirección o radio de tolerancia geodésica.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la sede', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Sede actualizada.', type: LugarPractica })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarLugarPracticaDto,
  ): Promise<LugarPractica> {
    return this.servicio.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Eliminar una sede',
    description: 'Remueve una sede del catálogo institucional.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la sede', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Sede eliminada satisfactoriamente.' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.servicio.eliminar(id);
  }
}
