import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';
import { SolicitudPasajes, EstadoSolicitud } from '../pasajes/entidades/solicitud-pasaje.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Evaluacion, EstadoEvaluacion } from '../evaluaciones/entidades/evaluacion.entidad';

export interface MetricasGenerales {
  total_becarios_activos: number;
  total_horas_acumuladas: number;
  promedio_horas_por_becario: number;
  evaluaciones_pendientes: number;
  solicitudes_pasajes_pendientes: number;
}

export interface ConsolidadoPresupuesto80 {
  total_declarado: number;
  total_reembolso_80: number;
  limite_mensual_institucional: number;
  porcentaje_consumido: number;
  monto_aprobado: number;
  monto_pendiente: number;
}

export interface ItemTendenciaMensualHoras {
  mes: string;
  horas: number;
}

export interface PosicionRankingPuntualidad {
  puesto: number;
  becario_id: number;
  nombre: string;
  carrera: string;
  total_asistencias: number;
  asistencias_a_tiempo: number;
  asistencias_dentro_radio: number;
  porcentaje_puntualidad: number;
}

export interface EstadisticasDashboard {
  metricas_generales: MetricasGenerales;
  presupuesto_80: ConsolidadoPresupuesto80;
  tendencia_horas: ItemTendenciaMensualHoras[];
  ranking_puntualidad: PosicionRankingPuntualidad[];
}

const NOMBRES_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const LIMITE_PRESUPUESTO_DEFECTO = 10000;

@Injectable()
export class DashboardServicio {
  constructor(
    @InjectRepository(RegistroAsistencia)
    private readonly asistencia_repo: Repository<RegistroAsistencia>,
    @InjectRepository(SolicitudPasajes)
    private readonly pasajes_repo: Repository<SolicitudPasajes>,
    @InjectRepository(Becario)
    private readonly becario_repo: Repository<Becario>,
    @InjectRepository(Evaluacion)
    private readonly evaluacion_repo: Repository<Evaluacion>,
  ) {}

  async obtenerEstadisticas(): Promise<EstadisticasDashboard> {
    const [
      becarios,
      asistencias,
      solicitudes,
      evaluaciones_pendientes,
    ] = await Promise.all([
      this.becario_repo.find({ relations: { usuario: true } }),
      this.asistencia_repo.find({ relations: { becario: { usuario: true } } }),
      this.pasajes_repo.find(),
      this.evaluacion_repo.count({ where: { estado: EstadoEvaluacion.PENDIENTE } }),
    ]);

    const total_becarios_activos = becarios.length;

    // 1. Consolidación de Horas
    let total_horas_acumuladas = 0;
    const horas_por_mes: Record<number, number> = {};
    for (let i = 0; i < 12; i++) {
      horas_por_mes[i] = 0;
    }

    const metricas_becario: Record<
      number,
      {
        nombre: string;
        carrera: string;
        total: number;
        a_tiempo: number;
        en_radio: number;
      }
    > = {};

    for (const b of becarios) {
      metricas_becario[b.id] = {
        nombre: b.usuario?.nombre || `Becario #${b.id}`,
        carrera: b.carrera || 'No especificada',
        total: 0,
        a_tiempo: 0,
        en_radio: 0,
      };
    }

    for (const reg of asistencias) {
      const horas = Number(reg.horas_trabajadas || 0);
      total_horas_acumuladas += horas;

      if (reg.fecha) {
        const fecha = new Date(reg.fecha);
        const mes_idx = fecha.getMonth();
        horas_por_mes[mes_idx] = (horas_por_mes[mes_idx] || 0) + horas;
      }

      if (metricas_becario[reg.becario_id]) {
        metricas_becario[reg.becario_id].total += 1;
        if (reg.dentro_de_horario) {
          metricas_becario[reg.becario_id].a_tiempo += 1;
        }
        if (reg.dentro_de_radio) {
          metricas_becario[reg.becario_id].en_radio += 1;
        }
      }
    }

    total_horas_acumuladas = Number(total_horas_acumuladas.toFixed(2));
    const promedio_horas_por_becario = total_becarios_activos > 0
      ? Number((total_horas_acumuladas / total_becarios_activos).toFixed(2))
      : 0;

    const tendencia_horas: ItemTendenciaMensualHoras[] = NOMBRES_MESES.map((mes, idx) => ({
      mes,
      horas: Number(horas_por_mes[idx].toFixed(2)),
    }));

    // 2. Consolidación de Presupuesto del 80%
    let total_declarado = 0;
    let total_reembolso_80 = 0;
    let monto_aprobado = 0;
    let monto_pendiente = 0;
    let solicitudes_pasajes_pendientes = 0;

    for (const s of solicitudes) {
      const declarado = Number(s.monto_total || 0);
      const reembolso = Number(s.monto_devolucion || 0);
      total_declarado += declarado;
      total_reembolso_80 += reembolso;

      if (s.estado === EstadoSolicitud.APROBADO) {
        monto_aprobado += reembolso;
      } else if (s.estado === EstadoSolicitud.PENDIENTE) {
        monto_pendiente += reembolso;
        solicitudes_pasajes_pendientes += 1;
      }
    }

    total_declarado = Number(total_declarado.toFixed(2));
    total_reembolso_80 = Number(total_reembolso_80.toFixed(2));
    monto_aprobado = Number(monto_aprobado.toFixed(2));
    monto_pendiente = Number(monto_pendiente.toFixed(2));

    const porcentaje_consumido = LIMITE_PRESUPUESTO_DEFECTO > 0
      ? Number(Math.min(100, (total_reembolso_80 / LIMITE_PRESUPUESTO_DEFECTO) * 100).toFixed(1))
      : 0;

    // 3. Consolidación de Ranking de Puntualidad
    const ranking_lista = Object.entries(metricas_becario).map(([b_id, data]) => {
      const becario_id = Number(b_id);
      const porcentaje_puntualidad = data.total > 0
        ? Number(((data.a_tiempo / data.total) * 100).toFixed(1))
        : 100;
      return {
        becario_id,
        nombre: data.nombre,
        carrera: data.carrera,
        total_asistencias: data.total,
        asistencias_a_tiempo: data.a_tiempo,
        asistencias_dentro_radio: data.en_radio,
        porcentaje_puntualidad,
      };
    });

    ranking_lista.sort((a, b) => {
      if (b.porcentaje_puntualidad !== a.porcentaje_puntualidad) {
        return b.porcentaje_puntualidad - a.porcentaje_puntualidad;
      }
      return b.total_asistencias - a.total_asistencias;
    });

    const ranking_puntualidad: PosicionRankingPuntualidad[] = ranking_lista.map((item, index) => ({
      puesto: index + 1,
      ...item,
    }));

    return {
      metricas_generales: {
        total_becarios_activos,
        total_horas_acumuladas,
        promedio_horas_por_becario,
        evaluaciones_pendientes,
        solicitudes_pasajes_pendientes,
      },
      presupuesto_80: {
        total_declarado,
        total_reembolso_80,
        limite_mensual_institucional: LIMITE_PRESUPUESTO_DEFECTO,
        porcentaje_consumido,
        monto_aprobado,
        monto_pendiente,
      },
      tendencia_horas,
      ranking_puntualidad,
    };
  }
}
