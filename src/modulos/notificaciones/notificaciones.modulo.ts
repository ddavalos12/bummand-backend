import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from './entidades/notificacion.entidad';
import { NotificacionesControlador } from './notificaciones.controlador';
import { NotificacionesServicio } from './notificaciones.servicio';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion])],
  controllers: [NotificacionesControlador],
  providers: [NotificacionesServicio],
  exports: [TypeOrmModule, NotificacionesServicio],
})
export class NotificacionesModulo {}
