import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IglesiasServicio } from './iglesias.servicio';
import { CrearIglesiaDto } from './dtos/crear-iglesia.dto';
import { ActualizarIglesiaDto } from './dtos/actualizar-iglesia.dto';
import { Iglesia } from './entidades/iglesia.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Iglesias')
@ApiBearerAuth('JWT-auth')
@Controller('iglesias')
@UseGuards(JwtGuardia, RolesGuardia)
export class IglesiasControlador {
  constructor(private readonly servicio: IglesiasServicio) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar nueva iglesia',
    description: 'Añade una congregación cristiana al catálogo institucional.',
  })
  @ApiResponse({ status: 201, description: 'Iglesia registrada exitosamente.', type: Iglesia })
  crear(@Body() dto: CrearIglesiaDto): Promise<Iglesia> {
    return this.servicio.crear(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Listar congregaciones e iglesias',
    description: 'Retorna el catálogo completo de iglesias registradas en el programa BUMAND.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de iglesias.', type: [Iglesia] })
  listar(): Promise<Iglesia[]> {
    return this.servicio.listar();
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Obtener iglesia por ID',
    description: 'Consulta los datos de una iglesia específica.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la iglesia', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle de la iglesia.', type: Iglesia })
  @ApiResponse({ status: 404, description: 'Iglesia no encontrada.' })
  obtener(@Param('id', ParseIntPipe) id: number): Promise<Iglesia> {
    return this.servicio.obtener(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar datos de una iglesia',
    description: 'Modifica el nombre o información de la congregación.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la iglesia', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Iglesia actualizada.', type: Iglesia })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarIglesiaDto,
  ): Promise<Iglesia> {
    return this.servicio.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Eliminar una iglesia',
    description: 'Remueve una congregación del catálogo si no tiene becarios asociados.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la iglesia', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Iglesia eliminada satisfactoriamente.' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.servicio.eliminar(id);
  }
}
