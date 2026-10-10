import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DevocionalesServicio } from './devocionales.servicio';
import { Devocional } from './entidades/devocional.entidad';
import { CrearDevocionalDto } from './dtos/crear-devocional.dto';
import { RetroalimentarDevocionalDto } from './dtos/retroalimentar-devocional.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Devocionales')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('devocionales')
export class DevocionalesControlador {
  constructor(private readonly devocionalesServicio: DevocionalesServicio) {}

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post()
  @ApiOperation({
    summary: 'Registrar devocional o meditación bíblica',
    description: 'Permite al becario registrar su lectura bíblica, reflexión personal y motivo de oración como parte de su formación diaconal.',
  })
  @ApiResponse({ status: 201, description: 'Devocional registrado exitosamente.', type: Devocional })
  @ApiResponse({ status: 400, description: 'Datos incompletos o inválidos.' })
  crear(
    @Body() crearDevocionalDto: CrearDevocionalDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Devocional> {
    return this.devocionalesServicio.crear(crearDevocionalDto, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR, Rol.BECARIO)
  @Get()
  @ApiOperation({
    summary: 'Listar devocionales institucionales',
    description: 'Retorna el catálogo cronológico de devocionales de los becarios con sus reflexiones y estado de revisión pastoral.',
  })
  @ApiResponse({ status: 200, description: 'Listado de devocionales.', type: [Devocional] })
  obtenerTodos(): Promise<Devocional[]> {
    return this.devocionalesServicio.obtenerTodos();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id')
  @ApiOperation({
    summary: 'Listar devocionales de un becario',
    description: 'Retorna el historial de devocionales y crecimiento espiritual de un becario específico.',
  })
  @ApiParam({ name: 'becario_id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Devocionales del becario.', type: [Devocional] })
  obtenerPorBecario(@Param('becario_id', ParseIntPipe) becario_id: number): Promise<Devocional[]> {
    return this.devocionalesServicio.obtenerPorBecario(becario_id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un devocional',
    description: 'Consulta el contenido íntegro de una reflexión bíblica y comentarios pastorales.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del devocional', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle del devocional.', type: Devocional })
  @ApiResponse({ status: 404, description: 'Devocional no encontrado.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<Devocional> {
    return this.devocionalesServicio.obtenerPorId(id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/retroalimentar')
  @ApiOperation({
    summary: 'Retroalimentación pastoral de devocional',
    description: 'Permite al pastor o mentor ingresar una respuesta espiritual u orientación pastoral al devocional del becario.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del devocional', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Devocional retroalimentado con éxito.', type: Devocional })
  @ApiResponse({ status: 404, description: 'Devocional no encontrado.' })
  retroalimentar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RetroalimentarDevocionalDto,
  ): Promise<Devocional> {
    return this.devocionalesServicio.retroalimentarPastor(id, dto);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar devocional',
    description: 'Elimina un registro devocional previo.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del devocional', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Devocional eliminado con éxito.' })
  @ApiResponse({ status: 404, description: 'Devocional no encontrado.' })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.devocionalesServicio.eliminar(id);
  }
}
