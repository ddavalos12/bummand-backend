import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardServicio, EstadisticasDashboard } from './dashboard.servicio';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@UseGuards(JwtGuardia, RolesGuardia)
@Controller('dashboard')
export class DashboardControlador {
  constructor(private readonly dashboard_servicio: DashboardServicio) {}

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get('estadisticas')
  obtenerEstadisticas(): Promise<EstadisticasDashboard> {
    return this.dashboard_servicio.obtenerEstadisticas();
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Get()
  obtenerResumen(): Promise<EstadisticasDashboard> {
    return this.dashboard_servicio.obtenerEstadisticas();
  }
}
