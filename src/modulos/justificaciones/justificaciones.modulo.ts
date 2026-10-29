import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Justificacion } from './entidades/justificacion.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { AsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';
import { Multa } from '../asistencia/entidades/multa.entidad';
import { RegistroAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';
import { JustificacionesServicio } from './justificaciones.servicio';
import { JustificacionesControlador } from './justificaciones.controlador';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Justificacion,
      Becario,
      AsistenciaEvento,
      Multa,
      RegistroAsistencia,
    ]),
  ],
  controllers: [JustificacionesControlador],
  providers: [JustificacionesServicio],
  exports: [TypeOrmModule, JustificacionesServicio],
})
export class JustificacionesModulo {}
