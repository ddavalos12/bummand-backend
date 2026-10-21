import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciaControlador } from './asistencia.controlador';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { Multa } from './entidades/multa.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { Iglesia } from '../iglesias/entidades/iglesia.entidad';
import { Justificacion } from '../justificaciones/entidades/justificacion.entidad';
import { NotificacionesModulo } from '../notificaciones/notificaciones.modulo';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegistroAsistencia, Becario, LugarPractica, Multa, Iglesia, Justificacion]),
    NotificacionesModulo,
  ],
  controllers: [AsistenciaControlador],
  providers: [AsistenciaServicio],
  exports: [TypeOrmModule, AsistenciaServicio],
})
export class AsistenciaModulo {}
