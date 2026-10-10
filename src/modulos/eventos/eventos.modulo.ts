import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evento } from './entidades/evento.entidad';
import { AsistenciaEvento } from './entidades/asistencia-evento.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { EventosServicio } from './eventos.servicio';
import { EventosControlador } from './eventos.controlador';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evento, AsistenciaEvento, Becario]),
  ],
  controllers: [EventosControlador],
  providers: [EventosServicio],
  exports: [TypeOrmModule, EventosServicio],
})
export class EventosModulo {}
