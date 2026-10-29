import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DevocionalesServicio } from './devocionales.servicio';
import { Devocional } from './entidades/devocional.entidad';
import { CitaSeguimiento } from './entidades/cita-seguimiento.entidad';
import { CrearDevocionalDto } from './dtos/crear-devocional.dto';
import { RetroalimentarDevocionalDto } from './dtos/retroalimentar-devocional.dto';
import { CrearCitaSeguimientoDto } from './dtos/crear-cita-seguimiento.dto';
import { ActualizarCitaSeguimientoDto } from './dtos/actualizar-cita-seguimiento.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Devocionales y Seguimiento Pastoral')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('devocionales')
export class DevocionalesControlador {
  constructor(private readonly devocionalesServicio: DevocionalesServicio) {}

  @Roles(Rol.BECARIO)
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

  @Roles(Rol.SUPERVISOR, Rol.BECARIO)
  @Get()
  @ApiOperation({
    summary: 'Listar devocionales institucionales',
    description: 'Retorna el catálogo cronológico de devocionales de los becarios según el rol (supervisor ve su cohorte, becario ve los suyos).',
  })
  @ApiResponse({ status: 200, description: 'Listado de devocionales.', type: [Devocional] })
  obtenerTodos(@Req() req: any): Promise<Devocional[]> {
    return this.devocionalesServicio.obtenerTodos(req.user);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR)
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

  // --- Citas de Seguimiento y Supervisión Pastoral ---

  @Roles(Rol.SUPERVISOR)
  @Get('mis-supervisados')
  @ApiOperation({
    summary: 'Listar becarios asignados al supervisor',
    description: 'Retorna los becarios asignados a la cohorte del supervisor autenticado para agendamiento de citas.',
  })
  @ApiResponse({ status: 200, description: 'Listado de becarios supervisados.' })
  obtenerMisSupervisados(@Req() req: any) {
    return this.devocionalesServicio.obtenerMisSupervisados(req.user.id);
  }

  @Roles(Rol.SUPERVISOR)
  @Post('citas')
  @ApiOperation({
    summary: 'Agendar cita de seguimiento y retroalimentación',
    description: 'Permite al supervisor agendar una reunión de retroalimentación presencial o virtual con un becario.',
  })
  @ApiResponse({ status: 201, description: 'Cita de seguimiento agendada exitosamente.', type: CitaSeguimiento })
  @ApiResponse({ status: 400, description: 'Becario no pertenece a la supervisión.' })
  @ApiResponse({ status: 404, description: 'Becario no encontrado.' })
  crearCita(@Req() req: any, @Body() dto: CrearCitaSeguimientoDto): Promise<CitaSeguimiento> {
    return this.devocionalesServicio.crearCitaSeguimiento(req.user.id, dto);
  }

  @Roles(Rol.SUPERVISOR, Rol.BECARIO)
  @Get('citas')
  @ApiOperation({
    summary: 'Listar citas de seguimiento',
    description: 'Retorna las citas de seguimiento asociadas al supervisor o al becario autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Listado de citas de seguimiento.', type: [CitaSeguimiento] })
  obtenerCitas(@Req() req: any): Promise<CitaSeguimiento[]> {
    return this.devocionalesServicio.obtenerCitasSeguimiento(req.user);
  }

  @Roles(Rol.SUPERVISOR)
  @Patch('citas/:id')
  @ApiOperation({
    summary: 'Actualizar cita de seguimiento o registrar acuerdos',
    description: 'Permite al supervisor cambiar estado, reprogramar o asentar los acuerdos y reflexiones de la reunión.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la cita', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Cita actualizada exitosamente.', type: CitaSeguimiento })
  @ApiResponse({ status: 403, description: 'No autorizado para modificar esta cita.' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada.' })
  actualizarCita(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: ActualizarCitaSeguimientoDto,
  ): Promise<CitaSeguimiento> {
    return this.devocionalesServicio.actualizarCitaSeguimiento(id, req.user.id, dto);
  }

  // --- Fin Citas de Seguimiento ---

  @Roles(Rol.BECARIO, Rol.SUPERVISOR)
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

  @Roles(Rol.SUPERVISOR)
  @Patch(':id/retroalimentar')
  @ApiOperation({
    summary: 'Retroalimentación pastoral de devocional',
    description: 'Permite al supervisor ingresar una respuesta espiritual u orientación pastoral al devocional del becario.',
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

  @Roles(Rol.BECARIO)
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
