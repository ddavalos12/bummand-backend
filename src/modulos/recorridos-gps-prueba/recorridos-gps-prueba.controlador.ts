import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecorridosGpsPruebaServicio } from './recorridos-gps-prueba.servicio';
import { CrearRecorridoGpsPruebaDto } from './dtos/crear-recorrido-gps-prueba.dto';
import { RecorridoGpsPrueba } from './entidades/recorrido-gps-prueba.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Recorridos GPS (Prueba)')
@Controller(['recorridos-gps-prueba', 'api/recorridos-gps-prueba'])
export class RecorridosGpsPruebaControlador {
  constructor(private readonly servicio: RecorridosGpsPruebaServicio) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar recorrido GPS de prueba (público)',
    description:
      'Recibe una sesión de recorrido GPS desde móvil, verifica integridad SHA-256, evalúa reglas anti-fraude y calcula distancia Haversine.',
  })
  @ApiResponse({
    status: 201,
    description: 'Recorrido GPS de prueba registrado o recuperado por idempotencia.',
    type: RecorridoGpsPrueba,
  })
  registrar(@Body() dto: CrearRecorridoGpsPruebaDto): Promise<RecorridoGpsPrueba> {
    return this.servicio.registrarRecorrido(dto);
  }

  @Get()
  @UseGuards(JwtGuardia, RolesGuardia)
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar recorridos GPS de prueba',
    description: 'Retorna todos los recorridos GPS de prueba ordenados del más reciente al más antiguo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de recorridos GPS de prueba.',
    type: [RecorridoGpsPrueba],
  })
  listar(): Promise<RecorridoGpsPrueba[]> {
    return this.servicio.listarTodos();
  }

  @Get(':id')
  @UseGuards(JwtGuardia, RolesGuardia)
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener detalle de recorrido GPS de prueba por ID',
    description: 'Retorna la trazabilidad completa de puntos, alertas anti-fraude e integridad de una sesión.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Detalle del recorrido GPS de prueba.',
    type: RecorridoGpsPrueba,
  })
  @ApiResponse({ status: 404, description: 'Recorrido no encontrado.' })
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RecorridoGpsPrueba> {
    return this.servicio.obtenerPorId(id);
  }

  @Delete(':id')
  @UseGuards(JwtGuardia, RolesGuardia)
  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar recorrido GPS de prueba',
    description: 'Elimina un recorrido GPS de prueba por su identificador.',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Recorrido eliminado correctamente.' })
  @ApiResponse({ status: 404, description: 'Recorrido no encontrado.' })
  eliminar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ mensaje: string; id: number }> {
    return this.servicio.eliminarPorId(id);
  }
}
