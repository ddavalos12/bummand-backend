import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Justificacion } from './entidades/justificacion.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { AsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';
import { JustificacionesServicio } from './justificaciones.servicio';
import { JustificacionesControlador } from './justificaciones.controlador';

@Module({
  imports: [
    TypeOrmModule.forFeature([Justificacion, Becario, AsistenciaEvento]),
  ],
  controllers: [JustificacionesControlador],
  providers: [JustificacionesServicio],
  exports: [TypeOrmModule, JustificacionesServicio],
})
export class JustificacionesModulo {}
