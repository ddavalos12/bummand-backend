import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluacionesControlador } from './evaluaciones.controlador';
import { EvaluacionesServicio } from './evaluaciones.servicio';
import { Evaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluacion,
      ModuloEvaluacion,
      PeriodoEvaluacion,
      Evaluador,
      EvaluacionPastor,
    ]),
  ],
  controllers: [EvaluacionesControlador],
  providers: [EvaluacionesServicio],
  exports: [TypeOrmModule, EvaluacionesServicio],
})
export class EvaluacionesModulo {}
