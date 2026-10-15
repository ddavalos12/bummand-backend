import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemillaServicio } from './semilla.servicio';
import { Usuario } from '../modulos/usuarios/entidades/usuario.entidad';
import { Becario } from '../modulos/becarios/entidades/becario.entidad';
import { HorarioApoyo } from '../modulos/becarios/entidades/horario-apoyo.entidad';
import { AsignacionPractica } from '../modulos/becarios/entidades/asignacion-practica.entidad';
import { LugarPractica } from '../modulos/lugares-practica/entidades/lugar-practica.entidad';
import { Iglesia } from '../modulos/iglesias/entidades/iglesia.entidad';
import { ModuloEvaluacion } from '../modulos/evaluaciones/entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from '../modulos/evaluaciones/entidades/periodo-evaluacion.entidad';
import { Evaluador } from '../modulos/evaluaciones/entidades/evaluador.entidad';
import { TarifaTransporte } from '../modulos/pasajes/entidades/tarifa-transporte.entidad';
import { ParadaTransporte } from '../modulos/pasajes/entidades/parada-transporte.entidad';
import { Evento } from '../modulos/eventos/entidades/evento.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Becario,
      HorarioApoyo,
      AsignacionPractica,
      LugarPractica,
      Iglesia,
      ModuloEvaluacion,
      PeriodoEvaluacion,
      Evaluador,
      TarifaTransporte,
      ParadaTransporte,
      Evento,
    ]),
  ],
  providers: [SemillaServicio],
  exports: [SemillaServicio],
})
export class DatosModulo {}
