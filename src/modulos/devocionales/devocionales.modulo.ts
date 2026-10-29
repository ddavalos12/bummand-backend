import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevocionalesControlador } from './devocionales.controlador';
import { DevocionalesServicio } from './devocionales.servicio';
import { Devocional } from './entidades/devocional.entidad';
import { CitaSeguimiento } from './entidades/cita-seguimiento.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { NotificacionesModulo } from '../notificaciones/notificaciones.modulo';

@Module({
  imports: [
    TypeOrmModule.forFeature([Devocional, CitaSeguimiento, Becario]),
    NotificacionesModulo,
  ],
  controllers: [DevocionalesControlador],
  providers: [DevocionalesServicio],
  exports: [TypeOrmModule, DevocionalesServicio],
})
export class DevocionalesModulo {}
