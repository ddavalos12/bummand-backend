import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluacionesControlador } from './evaluaciones.controlador';
import { EvaluacionesServicio } from './evaluaciones.servicio';
import { Evaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';
import { PreguntaBienestar } from './entidades/pregunta-bienestar.entidad';
import { CasoSeguimientoPastoral } from './entidades/caso-seguimiento-pastoral.entidad';
import { Cuestionario } from './entidades/cuestionario.entidad';
import { PreguntaCuestionario } from './entidades/pregunta-cuestionario.entidad';
import { EntregaTareaLideres } from './entidades/entrega-tarea-lideres.entidad';
import { DocumentoSemestralBecario } from '../becarios/entidades/documento-semestral-becario.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { BibliaModulo } from '../biblia/biblia.modulo';
import { NotificacionesModulo } from '../notificaciones/notificaciones.modulo';
import { TiempoRealModulo } from '../tiempo-real/tiempo-real.modulo';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluacion,
      ModuloEvaluacion,
      PeriodoEvaluacion,
      Evaluador,
      EvaluacionPastor,
      PreguntaBienestar,
      CasoSeguimientoPastoral,
      Cuestionario,
      PreguntaCuestionario,
      EntregaTareaLideres,
      DocumentoSemestralBecario,
      Becario,
      Usuario,
    ]),
    BibliaModulo,
    NotificacionesModulo,
    TiempoRealModulo,
  ],
  controllers: [EvaluacionesControlador],
  providers: [EvaluacionesServicio],
  exports: [TypeOrmModule, EvaluacionesServicio],
})
export class EvaluacionesModulo {}
