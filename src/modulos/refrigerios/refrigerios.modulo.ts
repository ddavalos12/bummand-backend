import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Refrigerio } from './entidades/refrigerio.entidad';
import { RefrigeriosControlador } from './refrigerios.controlador';
import { RefrigeriosServicio } from './refrigerios.servicio';
import { Evento } from '../eventos/entidades/evento.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { NotificacionesModulo } from '../notificaciones/notificaciones.modulo';

@Module({
  imports: [
    TypeOrmModule.forFeature([Refrigerio, Evento, LugarPractica, Usuario, Becario]),
    NotificacionesModulo,
  ],
  controllers: [RefrigeriosControlador],
  providers: [RefrigeriosServicio],
  exports: [TypeOrmModule, RefrigeriosServicio],
})
export class RefrigeriosModulo {}
