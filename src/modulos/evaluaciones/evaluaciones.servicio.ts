import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluacion, EstadoEvaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';
import { CrearEvaluacionDto } from './dtos/crear-evaluacion.dto';

export const PESOS_PONDERADOS_MODULOS: Record<
  number,
  { nombre: string; peso_porcentaje: number; evaluador_tipo: string }
> = {
  1: {
    nombre: 'Liderazgo en la Iglesia (Formulario F-03)',
    peso_porcentaje: 25,
    evaluador_tipo: 'Pastor de la Congregación',
  },
  2: {
    nombre: 'Autoevaluación Académica',
    peso_porcentaje: 20,
    evaluador_tipo: 'Estudiante Becario',
  },
  3: {
    nombre: 'Evaluación del Mentor / Prácticas',
    peso_porcentaje: 25,
    evaluador_tipo: 'Supervisor Diaconía',
  },
  4: {
    nombre: 'Evaluación Escuela de Líderes',
    peso_porcentaje: 15,
    evaluador_tipo: 'Facilitador Pastoral',
  },
  5: {
    nombre: 'Evaluación Socioeconómica',
    peso_porcentaje: 15,
    evaluador_tipo: 'Trabajador Social',
  },
};

export interface DetalleModuloCalculo {
  modulo_id: number;
  nombre: string;
  evaluador_rol: string;
  peso_porcentaje: number;
  puntaje: number;
  contribucion_ponderada: number;
  estado: EstadoEvaluacion;
}

export interface ResultadoCalificacionTotal {
  becario_id: number;
  periodo_id: number;
  calificacion_total_100: number;
  calificacion_vigesimal: number;
  rendimiento: 'Sobresaliente' | 'Muy Bueno' | 'Bueno' | 'En Observación' | 'Insuficiente';
  modulos_evaluados: number;
  total_modulos: number;
  es_completa: boolean;
  detalles: DetalleModuloCalculo[];
}

@Injectable()
export class EvaluacionesServicio {
  constructor(
    @InjectRepository(Evaluacion)
    private readonly evaluacion_repo: Repository<Evaluacion>,
    @InjectRepository(ModuloEvaluacion)
    private readonly modulo_repo: Repository<ModuloEvaluacion>,
    @InjectRepository(PeriodoEvaluacion)
    private readonly periodo_repo: Repository<PeriodoEvaluacion>,
    @InjectRepository(Evaluador)
    private readonly evaluador_repo: Repository<Evaluador>,
    @InjectRepository(EvaluacionPastor)
    private readonly evaluacion_pastor_repo: Repository<EvaluacionPastor>,
  ) {}

  calcularCalificacionPonderadaDirecta(
    puntajes_por_modulo: Record<number, number>,
  ): {
    calificacion_total_100: number;
    calificacion_vigesimal: number;
    rendimiento: 'Sobresaliente' | 'Muy Bueno' | 'Bueno' | 'En Observación' | 'Insuficiente';
  } {
    let calificacion_acumulada = 0;
    for (const [id_str, config] of Object.entries(PESOS_PONDERADOS_MODULOS)) {
      const id = Number(id_str);
      const puntaje = Math.min(Math.max(puntajes_por_modulo[id] ?? 0, 0), 100);
      const contribucion = (puntaje * config.peso_porcentaje) / 100;
      calificacion_acumulada += contribucion;
    }

    const calificacion_total_100 = Number(calificacion_acumulada.toFixed(2));
    const calificacion_vigesimal = Number(((calificacion_total_100 * 20) / 100).toFixed(2));

    let rendimiento: 'Sobresaliente' | 'Muy Bueno' | 'Bueno' | 'En Observación' | 'Insuficiente' = 'Insuficiente';
    if (calificacion_total_100 >= 90) {
      rendimiento = 'Sobresaliente';
    } else if (calificacion_total_100 >= 80) {
      rendimiento = 'Muy Bueno';
    } else if (calificacion_total_100 >= 70) {
      rendimiento = 'Bueno';
    } else if (calificacion_total_100 >= 60) {
      rendimiento = 'En Observación';
    }

    return { calificacion_total_100, calificacion_vigesimal, rendimiento };
  }

  async calcularCalificacionTotal(
    becario_id: number,
    periodo_id: number,
  ): Promise<ResultadoCalificacionTotal> {
    const evaluaciones = await this.evaluacion_repo.find({
      where: { becario_id, periodo_id },
      relations: {
        modulo: true,
        evaluador: true,
        detalle_pastor: true,
      },
    });

    const detalles: DetalleModuloCalculo[] = [];
    let modulos_evaluados = 0;

    for (const [id_str, config] of Object.entries(PESOS_PONDERADOS_MODULOS)) {
      const modulo_id = Number(id_str);
      const evaluacion_encontrada = evaluaciones.find(
        (e) => e.modulo_id === modulo_id || e.modulo?.orden === modulo_id,
      );

      const puntaje = evaluacion_encontrada?.puntaje !== null && evaluacion_encontrada?.puntaje !== undefined
        ? Number(evaluacion_encontrada.puntaje)
        : 0;

      const estado = evaluacion_encontrada?.estado ?? EstadoEvaluacion.PENDIENTE;
      if (evaluacion_encontrada && evaluacion_encontrada.estado === EstadoEvaluacion.COMPLETADO) {
        modulos_evaluados++;
      }

      const contribucion_ponderada = Number(
        ((puntaje * config.peso_porcentaje) / 100).toFixed(2),
      );

      detalles.push({
        modulo_id,
        nombre: evaluacion_encontrada?.modulo?.nombre ?? config.nombre,
        evaluador_rol: config.evaluador_tipo,
        peso_porcentaje: config.peso_porcentaje,
        puntaje,
        contribucion_ponderada,
        estado,
      });
    }

    const suma_ponderada = detalles.reduce((acc, d) => acc + d.contribucion_ponderada, 0);
    const calificacion_total_100 = Number(suma_ponderada.toFixed(2));
    const calificacion_vigesimal = Number(((calificacion_total_100 * 20) / 100).toFixed(2));

    let rendimiento: 'Sobresaliente' | 'Muy Bueno' | 'Bueno' | 'En Observación' | 'Insuficiente' = 'Insuficiente';
    if (calificacion_total_100 >= 90) {
      rendimiento = 'Sobresaliente';
    } else if (calificacion_total_100 >= 80) {
      rendimiento = 'Muy Bueno';
    } else if (calificacion_total_100 >= 70) {
      rendimiento = 'Bueno';
    } else if (calificacion_total_100 >= 60) {
      rendimiento = 'En Observación';
    }

    return {
      becario_id,
      periodo_id,
      calificacion_total_100,
      calificacion_vigesimal,
      rendimiento,
      modulos_evaluados,
      total_modulos: Object.keys(PESOS_PONDERADOS_MODULOS).length,
      es_completa: modulos_evaluados === Object.keys(PESOS_PONDERADOS_MODULOS).length,
      detalles,
    };
  }

  async crear(crear_dto: CrearEvaluacionDto): Promise<Evaluacion> {
    const nueva_evaluacion = this.evaluacion_repo.create(crear_dto);
    return this.evaluacion_repo.save(nueva_evaluacion);
  }

  async obtenerTodas(): Promise<Evaluacion[]> {
    return this.evaluacion_repo.find({
      relations: {
        becario: { usuario: true },
        modulo: true,
        periodo: true,
        evaluador: true,
        detalle_pastor: true,
      },
      order: { id: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Evaluacion> {
    const evaluacion = await this.evaluacion_repo.findOne({
      where: { id },
      relations: {
        becario: { usuario: true },
        modulo: true,
        periodo: true,
        evaluador: true,
        detalle_pastor: true,
      },
    });
    if (!evaluacion) {
      throw new NotFoundException(`Evaluación con ID ${id} no encontrada`);
    }
    return evaluacion;
  }

  async obtenerPorBecario(becario_id: number): Promise<Evaluacion[]> {
    return this.evaluacion_repo.find({
      where: { becario_id },
      relations: {
        modulo: true,
        periodo: true,
        evaluador: true,
        detalle_pastor: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async cambiarEstado(id: number, estado: EstadoEvaluacion): Promise<Evaluacion> {
    const evaluacion = await this.obtenerPorId(id);
    evaluacion.estado = estado;
    return this.evaluacion_repo.save(evaluacion);
  }

  async listarModulos(): Promise<ModuloEvaluacion[]> {
    return this.modulo_repo.find({ order: { orden: 'ASC' } });
  }

  async listarPeriodos(): Promise<PeriodoEvaluacion[]> {
    return this.periodo_repo.find({ order: { id: 'DESC' } });
  }

  async listarEvaluadores(): Promise<Evaluador[]> {
    return this.evaluador_repo.find({ order: { nombre: 'ASC' } });
  }
}
