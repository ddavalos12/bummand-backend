import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardServicio, EstadisticasDashboard, SeguimientoSemanal } from './dashboard.servicio';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('dashboard')
export class DashboardControlador {
  constructor(private readonly dashboard_servicio: DashboardServicio) {}

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get('estadisticas')
  @ApiOperation({
    summary: 'Obtener métricas y KPIs consolidados',
    description: 'Calcula horas acumuladas, serie mensual de 12 meses, ejecución presupuestaria del 80%, ranking de puntualidad y multas institucionales. Permite segmentación por supervisor y por rango de fechas.',
  })
  @ApiQuery({ name: 'supervisor_id', required: false, description: 'ID del supervisor para filtrar sus becarios a cargo', type: Number })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha inicial para filtrar registros (YYYY-MM-DD)', type: String })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha final para filtrar registros (YYYY-MM-DD)', type: String })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas agregadas del dashboard.',
  })
  obtenerEstadisticas(
    @Query('supervisor_id') supervisor_id?: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<EstadisticasDashboard> {
    const id_filtro = supervisor_id ?? (usuario?.rol === Rol.SUPERVISOR ? usuario.id : undefined);
    return this.dashboard_servicio.obtenerEstadisticas(id_filtro, fecha_inicio, fecha_fin);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get('seguimiento-semanal')
  @ApiOperation({
    summary: 'Obtener seguimiento semanal de asistencia y puntualidad',
    description: 'Devuelve lista de becarios con retraso, y clasifica a los becarios según si asistieron o no en la semana.',
  })
  @ApiQuery({ name: 'supervisor_id', required: false, description: 'ID del supervisor para filtrar métricas', type: Number })
  @ApiQuery({ name: 'fecha', required: false, description: 'Fecha de referencia dentro de la semana objetivo (YYYY-MM-DD)', type: String })
  @ApiResponse({ status: 200, description: 'Seguimiento semanal consolidado.' })
  obtenerSeguimientoSemanal(
    @Query('supervisor_id') supervisor_id?: number,
    @Query('fecha') fecha?: string,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<SeguimientoSemanal> {
    const id_filtro = supervisor_id ?? (usuario?.rol === Rol.SUPERVISOR ? usuario.id : undefined);
    return this.dashboard_servicio.obtenerSeguimientoSemanal(id_filtro, fecha);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get()
  @ApiOperation({
    summary: 'Obtener resumen general del dashboard',
    description: 'Alias de estadísticas para la vista de inicio del panel administrativo.',
  })
  @ApiQuery({ name: 'supervisor_id', required: false, description: 'ID del supervisor para filtrar métricas' })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha inicial para filtrar registros (YYYY-MM-DD)', type: String })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha final para filtrar registros (YYYY-MM-DD)', type: String })
  @ApiResponse({ status: 200, description: 'Resumen de métricas.' })
  obtenerResumen(
    @Query('supervisor_id') supervisor_id?: number,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<EstadisticasDashboard> {
    const id_filtro = supervisor_id ?? (usuario?.rol === Rol.SUPERVISOR ? usuario.id : undefined);
    return this.dashboard_servicio.obtenerEstadisticas(id_filtro, fecha_inicio, fecha_fin);
  }
}
