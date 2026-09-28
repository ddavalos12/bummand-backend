import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciaControlador } from './asistencia.controlador';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroAsistencia, Becario])],
  controllers: [AsistenciaControlador],
  providers: [AsistenciaServicio],
  exports: [TypeOrmModule, AsistenciaServicio],
})
export class AsistenciaModulo {}
