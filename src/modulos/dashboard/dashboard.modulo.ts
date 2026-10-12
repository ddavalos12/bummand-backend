import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardControlador } from './dashboard.controlador';
import { DashboardServicio } from './dashboard.servicio';
import { RegistroAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';
import { SolicitudPasajes } from '../pasajes/entidades/solicitud-pasaje.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Evaluacion } from '../evaluaciones/entidades/evaluacion.entidad';
import { Multa } from '../asistencia/entidades/multa.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistroAsistencia,
      SolicitudPasajes,
      Becario,
      Evaluacion,
      Multa,
    ]),
  ],
  controllers: [DashboardControlador],
  providers: [DashboardServicio],
  exports: [DashboardServicio],
})
export class DashboardModulo {}
