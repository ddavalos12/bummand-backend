import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardServicio, EstadisticasDashboard } from './dashboard.servicio';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

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
    description: 'Calcula horas acumuladas, serie mensual de 12 meses, ejecución presupuestaria del 80% y ranking de puntualidad.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas agregadas del dashboard.',
    schema: {
      example: {
        total_horas_acumuladas: 2450.5,
        total_becarios_activos: 18,
        presupuesto_80_utilizado: 4250.80,
        presupuesto_80_tope: 10000.00,
        porcentaje_presupuesto: 42.51,
        solicitudes_pendientes: 4,
        horas_por_mes: [
          { mes: 'Ene', horas: 180 },
          { mes: 'Feb', horas: 210 },
        ],
        ranking_puntualidad: [
          { nombre: 'Nilda Churata', porcentaje: 98.5 },
        ],
      },
    },
  })
  obtenerEstadisticas(): Promise<EstadisticasDashboard> {
    return this.dashboard_servicio.obtenerEstadisticas();
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get()
  @ApiOperation({
    summary: 'Obtener resumen general del dashboard',
    description: 'Alias de estadísticas para la vista de inicio del panel administrativo.',
  })
  @ApiResponse({ status: 200, description: 'Resumen de métricas.' })
  obtenerResumen(): Promise<EstadisticasDashboard> {
    return this.dashboard_servicio.obtenerEstadisticas();
  }
}
