import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardServicio, EstadisticasDashboard } from './dashboard.servicio';
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
    description: 'Calcula horas acumuladas, serie mensual de 12 meses, ejecución presupuestaria del 80% y ranking de puntualidad. Permite segmentación por supervisor.',
  })
  @ApiQuery({ name: 'supervisor_id', required: false, description: 'ID del supervisor para filtrar sus becarios a cargo', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas agregadas del dashboard.',
  })
  obtenerEstadisticas(
    @Query('supervisor_id') supervisor_id?: number,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<EstadisticasDashboard> {
    const id_filtro = supervisor_id ?? (usuario?.rol === Rol.SUPERVISOR ? usuario.id : undefined);
    return this.dashboard_servicio.obtenerEstadisticas(id_filtro);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get()
  @ApiOperation({
    summary: 'Obtener resumen general del dashboard',
    description: 'Alias de estadísticas para la vista de inicio del panel administrativo.',
  })
  @ApiQuery({ name: 'supervisor_id', required: false, description: 'ID del supervisor para filtrar métricas' })
  @ApiResponse({ status: 200, description: 'Resumen de métricas.' })
  obtenerResumen(
    @Query('supervisor_id') supervisor_id?: number,
    @UsuarioActual() usuario?: Usuario,
  ): Promise<EstadisticasDashboard> {
    const id_filtro = supervisor_id ?? (usuario?.rol === Rol.SUPERVISOR ? usuario.id : undefined);
    return this.dashboard_servicio.obtenerEstadisticas(id_filtro);
  }
}
