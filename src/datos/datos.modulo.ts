import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemillaServicio } from './semilla.servicio';
import { Usuario } from '../modulos/usuarios/entidades/usuario.entidad';
import { Becario } from '../modulos/becarios/entidades/becario.entidad';
import { LugarPractica } from '../modulos/lugares-practica/entidades/lugar-practica.entidad';
import { ModuloEvaluacion } from '../modulos/evaluaciones/entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from '../modulos/evaluaciones/entidades/periodo-evaluacion.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Becario,
      LugarPractica,
      ModuloEvaluacion,
      PeriodoEvaluacion,
    ]),
  ],
  providers: [SemillaServicio],
  exports: [SemillaServicio],
})
export class DatosModulo {}
