import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';
import { SolicitudPasajes, EstadoSolicitud } from '../pasajes/entidades/solicitud-pasaje.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Evaluacion, EstadoEvaluacion } from '../evaluaciones/entidades/evaluacion.entidad';
import { Multa } from '../asistencia/entidades/multa.entidad';

export interface MetricasGenerales {
  total_becarios_activos: number;
  total_horas_acumuladas: number;
  promedio_horas_por_becario: number;
  evaluaciones_pendientes: number;
  solicitudes_pasajes_pendientes: number;
  total_multas_bs: number;
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
  total_multas_bs?: number;
}

export interface InfoBecarioResumen {
  id: number;
  nombre: string;
  carrera: string;
  universidad?: string;
  unidad?: string | null;
}

export interface ItemBecarioConRetraso {
  becario: InfoBecarioResumen;
  hora_ingreso: string;
  hora_prevista: string;
  minutos_retraso: number;
  fecha: string;
}

export interface ItemBecarioAsistenciaSemanal {
  becario: InfoBecarioResumen;
  total_asistencias: number;
  ultima_fecha?: string;
}

export interface AsistenciaSemanalResultado {
  asistieron: ItemBecarioAsistenciaSemanal[];
  no_asistieron: ItemBecarioAsistenciaSemanal[];
}

export interface ConteoSeguimientoSemanal {
  total: number;
  asistieron: number;
  no_asistieron: number;
}

export interface SeguimientoSemanal {
  semana_inicio: string;
  semana_fin: string;
  becarios_con_retraso: ItemBecarioConRetraso[];
  asistencia_semanal: AsistenciaSemanalResultado;
  conteo: ConteoSeguimientoSemanal;
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
    @Optional()
    @InjectRepository(Multa)
    private readonly multa_repo?: Repository<Multa>,
  ) {}

  async obtenerEstadisticas(
    supervisor_id?: number,
    fecha_inicio?: string,
    fecha_fin?: string,
  ): Promise<EstadisticasDashboard> {
    const where_becario = supervisor_id ? { supervisor_id } : {};
    const [
      becarios,
      todas_asistencias,
      todas_solicitudes,
      evaluaciones_pendientes,
      todas_multas,
    ] = await Promise.all([
      this.becario_repo.find({ where: where_becario, relations: { usuario: true } }),
      this.asistencia_repo.find({ relations: { becario: { usuario: true } } }),
      this.pasajes_repo.find(),
      this.evaluacion_repo.count({ where: { estado: EstadoEvaluacion.PENDIENTE } }),
      this.multa_repo ? this.multa_repo.find() : Promise.resolve([]),
    ]);

    const set_becarios_permitidos = new Set(becarios.map((b) => b.id));
    let asistencias = supervisor_id
      ? todas_asistencias.filter((a) => set_becarios_permitidos.has(a.becario_id))
      : todas_asistencias;
    let solicitudes = supervisor_id
      ? todas_solicitudes.filter((s) => set_becarios_permitidos.has(s.becario_id))
      : todas_solicitudes;

    const d_inicio = fecha_inicio ? new Date(fecha_inicio) : null;
    const d_fin = fecha_fin
      ? new Date(fecha_fin.includes('T') ? fecha_fin : `${fecha_fin}T23:59:59.999Z`)
      : null;

    if (d_inicio || d_fin) {
      asistencias = asistencias.filter((a) => {
        if (!a.fecha) return false;
        const f = new Date(a.fecha);
        if (d_inicio && f < d_inicio) return false;
        if (d_fin && f > d_fin) return false;
        return true;
      });

      solicitudes = solicitudes.filter((s) => {
        const fecha_s = s.fecha_envio ? new Date(s.fecha_envio) : (s.created_at ? new Date(s.created_at) : null);
        if (!fecha_s) return true;
        if (d_inicio && fecha_s < d_inicio) return false;
        if (d_fin && fecha_s > d_fin) return false;
        return true;
      });
    }

    // Cálculo consolidado de multas institucionales
    const multas_filtradas = todas_multas.filter((m) => {
      if (!m.es_institucional) return false;
      if (supervisor_id && !set_becarios_permitidos.has(m.becario_id)) return false;
      if (!m.fecha_aplicacion) return true;
      const f = new Date(m.fecha_aplicacion);
      if (d_inicio && f < d_inicio) return false;
      if (d_fin && f > d_fin) return false;
      return true;
    });
    const total_multas_bs = Number(
      multas_filtradas.reduce((acc, m) => acc + Number(m.monto_bs || 0), 0).toFixed(2),
    );

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
        total_multas_bs,
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
      total_multas_bs,
    };
  }

  async obtenerSeguimientoSemanal(
    supervisor_id?: number,
    fecha_referencia?: string | Date,
  ): Promise<SeguimientoSemanal> {
    const base = fecha_referencia ? new Date(fecha_referencia) : new Date();
    const fecha_valida = isNaN(base.getTime()) ? new Date() : base;

    const dia_semana = fecha_valida.getDay();
    const dif_lunes = dia_semana === 0 ? -6 : 1 - dia_semana;

    const fecha_lunes = new Date(fecha_valida);
    fecha_lunes.setDate(fecha_valida.getDate() + dif_lunes);
    fecha_lunes.setHours(0, 0, 0, 0);

    const fecha_domingo = new Date(fecha_lunes);
    fecha_domingo.setDate(fecha_lunes.getDate() + 6);
    fecha_domingo.setHours(23, 59, 59, 999);

    const inicio_str = fecha_lunes.toISOString().split('T')[0];
    const fin_str = fecha_domingo.toISOString().split('T')[0];

    const where_becario = supervisor_id ? { supervisor_id } : {};
    const becarios = await this.becario_repo.find({
      where: where_becario,
      relations: { usuario: true },
      order: { id: 'ASC' },
    });

    const set_becarios = new Set(becarios.map((b) => b.id));
    const mapa_becarios = new Map<number, Becario>();
    for (const b of becarios) {
      mapa_becarios.set(b.id, b);
    }

    const asistencias_semana = await this.asistencia_repo
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.becario', 'becario')
      .leftJoinAndSelect('becario.usuario', 'usuario')
      .where('asistencia.fecha >= :inicio AND asistencia.fecha <= :fin', {
        inicio: inicio_str,
        fin: fin_str,
      })
      .orderBy('asistencia.fecha', 'DESC')
      .addOrderBy('asistencia.hora_ingreso', 'DESC')
      .getMany();

    const asistencias_filtradas = asistencias_semana.filter((a) => set_becarios.has(a.becario_id));

    // 1. Becarios con retraso
    const becarios_con_retraso: ItemBecarioConRetraso[] = [];
    for (const a of asistencias_filtradas) {
      const tiene_retraso = (a.minutos_retraso && a.minutos_retraso > 0) || a.dentro_de_horario === false;
      if (tiene_retraso && a.hora_ingreso) {
        const b = mapa_becarios.get(a.becario_id) || a.becario;
        const minutos = a.minutos_retraso > 0 ? a.minutos_retraso : 1;
        becarios_con_retraso.push({
          becario: {
            id: b ? b.id : a.becario_id,
            nombre: b?.usuario?.nombre || `Becario #${a.becario_id}`,
            carrera: b?.carrera || 'No registrada',
            universidad: b?.universidad || 'Universidad',
            unidad: b?.unidad || null,
          },
          hora_ingreso: a.hora_ingreso,
          hora_prevista: a.hora_prevista || '08:00',
          minutos_retraso: a.minutos_retraso || minutos,
          fecha: a.fecha instanceof Date ? a.fecha.toISOString().split('T')[0] : String(a.fecha),
        });
      }
    }

    // 2. Asistencia semanal: clasificar entre quienes asistieron y no asistieron
    const asistencias_por_becario = new Map<number, { total: number; ultima_fecha?: string }>();
    for (const a of asistencias_filtradas) {
      if (a.hora_ingreso) {
        const actual = asistencias_por_becario.get(a.becario_id) || { total: 0 };
        actual.total += 1;
        const f_str = a.fecha instanceof Date ? a.fecha.toISOString().split('T')[0] : String(a.fecha);
        if (!actual.ultima_fecha || f_str > actual.ultima_fecha) {
          actual.ultima_fecha = f_str;
        }
        asistencias_por_becario.set(a.becario_id, actual);
      }
    }

    const asistieron: ItemBecarioAsistenciaSemanal[] = [];
    const no_asistieron: ItemBecarioAsistenciaSemanal[] = [];

    for (const b of becarios) {
      const reg = asistencias_por_becario.get(b.id);
      const info: InfoBecarioResumen = {
        id: b.id,
        nombre: b.usuario?.nombre || `Becario #${b.id}`,
        carrera: b.carrera || 'No registrada',
        universidad: b.universidad || 'Universidad',
        unidad: b.unidad || null,
      };

      if (reg && reg.total > 0) {
        asistieron.push({
          becario: info,
          total_asistencias: reg.total,
          ultima_fecha: reg.ultima_fecha,
        });
      } else {
        no_asistieron.push({
          becario: info,
          total_asistencias: 0,
        });
      }
    }

    const conteo: ConteoSeguimientoSemanal = {
      total: becarios.length,
      asistieron: asistieron.length,
      no_asistieron: no_asistieron.length,
    };

    return {
      semana_inicio: inicio_str,
      semana_fin: fin_str,
      becarios_con_retraso,
      asistencia_semanal: {
        asistieron,
        no_asistieron,
      },
      conteo,
    };
  }
}
