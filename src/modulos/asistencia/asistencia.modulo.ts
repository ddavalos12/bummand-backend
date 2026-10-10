import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciaControlador } from './asistencia.controlador';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroAsistencia, Becario, LugarPractica])],
  controllers: [AsistenciaControlador],
  providers: [AsistenciaServicio],
  exports: [TypeOrmModule, AsistenciaServicio],
})
export class AsistenciaModulo {}
