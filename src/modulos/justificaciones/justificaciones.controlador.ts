import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JustificacionesServicio } from './justificaciones.servicio';
import { Justificacion } from './entidades/justificacion.entidad';
import { CrearJustificacionDto } from './dtos/crear-justificacion.dto';
import { ResolverJustificacionDto } from './dtos/resolver-justificacion.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Justificaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('justificaciones')
export class JustificacionesControlador {
  constructor(private readonly justificaciones_servicio: JustificacionesServicio) {}

  @Roles(Rol.BECARIO)
  @Post()
  @ApiOperation({
    summary: 'Enviar solicitud formal de justificación',
    description: 'Permite a los becarios enviar justificaciones por inasistencias o demoras en prácticas, eventos o Escuela de Líderes.',
  })
  @ApiResponse({ status: 201, description: 'Justificación radicada en estado pendiente.', type: Justificacion })
  @ApiResponse({ status: 400, description: 'Datos incompletos o inválidos.' })
  crear(
    @Body() crearJustificacionDto: CrearJustificacionDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Justificacion> {
    return this.justificaciones_servicio.crear(crearJustificacionDto, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get()
  @ApiOperation({
    summary: 'Listar todas las justificaciones',
    description: 'Permite a supervisores y administradores consultar la bandeja integral de justificaciones radicadas.',
  })
  @ApiResponse({ status: 200, description: 'Listado completo de justificaciones.', type: [Justificacion] })
  obtenerTodas(): Promise<Justificacion[]> {
    return this.justificaciones_servicio.obtenerTodas();
  }

  @Roles(Rol.BECARIO)
  @Get('mis-justificaciones')
  @ApiOperation({
    summary: 'Listar justificaciones del becario autenticado',
    description: 'Retorna el historial particular de justificaciones y el dictamen administrativo de cada una.',
  })
  @ApiResponse({ status: 200, description: 'Historial de justificaciones del usuario.', type: [Justificacion] })
  obtenerMisJustificaciones(@UsuarioActual() usuario: Usuario): Promise<Justificacion[]> {
    return this.justificaciones_servicio.obtenerPorBecario(usuario.id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener justificación por ID',
    description: 'Consulta el detalle, motivo y fundamentación de resolución de una justificación específica.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la justificación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle de la justificación.', type: Justificacion })
  @ApiResponse({ status: 404, description: 'Justificación no encontrada.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<Justificacion> {
    return this.justificaciones_servicio.obtenerPorId(id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/resolver')
  @ApiOperation({
    summary: 'Resolver justificación (Aprobación o Rechazo motivado)',
    description: 'Dictamina de forma motivada la aprobación o el rechazo institucional de la justificación.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la justificación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Justificación resuelta con éxito.', type: Justificacion })
  @ApiResponse({ status: 400, description: 'Resolución inválida o falta observación motivada.' })
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolverJustificacionDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Justificacion> {
    return this.justificaciones_servicio.resolver(id, dto, usuario.id);
  }
}
