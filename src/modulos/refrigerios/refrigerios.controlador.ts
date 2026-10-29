import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  RefrigeriosServicio,
  PlanillaReposicionRefrigerio,
  RespuestaMiTurno,
} from './refrigerios.servicio';
import { CrearRefrigerioDto } from './dtos/crear-refrigerio.dto';
import { ActualizarRefrigerioDto } from './dtos/actualizar-refrigerio.dto';
import { SortearDuplaDto } from './dtos/sortear-dupla.dto';
import { RendirRefrigerioDto } from './dtos/rendir-refrigerio.dto';
import { RevisarSupervisorDto } from './dtos/revisar-supervisor.dto';
import { AprobarAdministracionDto } from './dtos/aprobar-administracion.dto';
import { Refrigerio } from './entidades/refrigerio.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';

@ApiTags('Refrigerios')
@ApiBearerAuth('JWT-auth')
@Controller('refrigerios')
@UseGuards(JwtGuardia, RolesGuardia)
export class RefrigeriosControlador {
  constructor(private readonly refrigerios_servicio: RefrigeriosServicio) {}

  @Post('sortear-dupla')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Sortear o asignar dupla de 2 becarios encargados para el refrigerio del viernes',
    description:
      'Consulta los becarios activos y el historial de turnos para rotar equitativamente, o asigna manualmente a los dos becarios designados.',
  })
  @ApiResponse({ status: 201, description: 'Dupla sorteada y refrigerio programado.', type: Refrigerio })
  sortearDupla(
    @Body() dto: SortearDuplaDto,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<Refrigerio> {
    return this.refrigerios_servicio.sortearDupla(dto, usuario?.id);
  }

  @Get('mi-turno')
  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Consultar turno asignado de refrigerio para el usuario autenticado',
    description:
      'Devuelve si el becario autenticado integra la dupla activa, quién es su compañero, presupuesto y detalle de devolución.',
  })
  @ApiResponse({ status: 200, description: 'Estado del turno del usuario autenticado.' })
  obtenerMiTurno(@UsuarioActual() usuario: Usuario): Promise<RespuestaMiTurno> {
    return this.refrigerios_servicio.obtenerMiTurno(usuario.id);
  }

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
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Listar registros de refrigerios institucionales',
    description: 'Retorna el catálogo completo o filtrado por intervalo de fechas para auditoría.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Listado de refrigerios.', type: [Refrigerio] })
  listar(
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ): Promise<Refrigerio[]> {
    return this.refrigerios_servicio.listar({ fecha_inicio, fecha_fin });
  }

  @Get('planilla-reposicion/:id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Emitir planilla institucional de reposición de refrigerio',
    description: 'Genera el resumen oficial institucional para el trámite de reembolso y reposición de fondos al 100%.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del refrigerio', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Planilla de reposición emitida satisfactoriamente.' })
  generarPlanillaReposicion(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PlanillaReposicionRefrigerio> {
    return this.refrigerios_servicio.generarPlanillaReposicion(id);
  }

  @Patch(':id/rendir')
  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Rendir gastos e ingredientes del refrigerio por la dupla encargada',
    description:
      'Registra menú preparado, modalidad de preparación, ingredientes/insumos adquiridos y costo total para devolución al 100%.',
  })
  @ApiParam({ name: 'id', description: 'ID del refrigerio', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Refrigerio rendido con éxito.', type: Refrigerio })
  rendirRefrigerio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RendirRefrigerioDto,
  ): Promise<Refrigerio> {
    return this.refrigerios_servicio.rendirRefrigerio(id, dto);
  }

  @Patch(':id/revisar-supervisor')
  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Marcar rendición de refrigerio como revisada por Supervisor',
    description: 'Verifica los insumos y avanza el estado a revisado_supervisor para aprobación de Administración.',
  })
  @ApiParam({ name: 'id', description: 'ID del refrigerio', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Refrigerio revisado por supervisor.', type: Refrigerio })
  revisarSupervisor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevisarSupervisorDto,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<Refrigerio> {
    return this.refrigerios_servicio.revisarSupervisor(id, dto, usuario?.id || 1);
  }

  @Patch(':id/aprobar-administracion')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Aprobar reembolso del 100% y registrar al becario receptor único',
    description:
      'Aprueba la planilla al 100% y registra con firma/constancia a cuál de los dos becarios encargados se desembolsó la totalidad del dinero.',
  })
  @ApiParam({ name: 'id', description: 'ID del refrigerio', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Reembolso del 100% aprobado y registrado.', type: Refrigerio })
  aprobarAdministracion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarAdministracionDto,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<Refrigerio> {
    return this.refrigerios_servicio.aprobarAdministracion(id, dto, usuario?.id || 1);
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Obtener detalle de un refrigerio por ID',
    description: 'Consulta los montos, raciones, dupla, modalidad y conformidad en sistema del refrigerio.',
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
