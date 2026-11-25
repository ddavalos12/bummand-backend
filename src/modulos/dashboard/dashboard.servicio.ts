import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia, TipoAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';
import { SolicitudPasajes, EstadoSolicitud } from '../pasajes/entidades/solicitud-pasaje.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Evaluacion, EstadoEvaluacion } from '../evaluaciones/entidades/evaluacion.entidad';
import { Multa } from '../asistencia/entidades/multa.entidad';
import { Justificacion, EstadoJustificacion } from '../justificaciones/entidades/justificacion.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { obtenerBecariosDesignadosMentor } from '../../utilidades/filtro-mentor.utilidad';
import {
  extraerFechaIsoSinDesfase,
  NOMBRES_MESES_CORTOS_ESPANOL,
  obtenerFechaHoraBolivia,
  obtenerPeriodoCorteDesdeFechaIso,
} from '../../utilidades/fecha-bolivia.utilidad';

export interface MetricasGenerales {
  total_becarios_activos: number;
  total_horas_acumuladas: number;
  promedio_horas_por_becario: number;
  evaluaciones_pendientes: number;
  solicitudes_pasajes_pendientes: number;
  total_multas_bs: number;
  dias_permiso_aprobado?: number;
  horas_compensadas_permiso?: number;
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
  dias_permiso_aprobado?: number;
  horas_compensadas_permiso?: number;
}

export interface EstadisticasDashboard {
  metricas_generales: MetricasGenerales;
  presupuesto_80: ConsolidadoPresupuesto80;
  tendencia_horas: ItemTendenciaMensualHoras[];
  ranking_puntualidad: PosicionRankingPuntualidad[];
  total_multas_bs?: number;
  multas_recaudadas_bs?: number;
  incidencias_multas?: number;
  total_becarios?: number;
  evaluaciones_completadas?: number;
  porcentaje_puntualidad?: number;
  dias_permiso_aprobado?: number;
  horas_compensadas_permiso?: number;
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
  dias_permiso_aprobado?: number;
  horas_compensadas_permiso?: number;
}

export interface AsistenciaSemanalResultado {
  asistieron: ItemBecarioAsistenciaSemanal[];
  no_asistieron: ItemBecarioAsistenciaSemanal[];
}

export interface ConteoSeguimientoSemanal {
  total: number;
  asistieron: number;
  no_asistieron: number;
  dias_permiso_aprobado?: number;
  horas_compensadas_permiso?: number;
}

export interface SeguimientoSemanal {
  semana_inicio: string;
  semana_fin: string;
  becarios_con_retraso: ItemBecarioConRetraso[];
  asistencia_semanal: AsistenciaSemanalResultado;
  conteo: ConteoSeguimientoSemanal;
  dias_permiso_aprobado?: number;
  horas_compensadas_permiso?: number;
}

const NOMBRES_MESES = NOMBRES_MESES_CORTOS_ESPANOL;
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
    @Optional()
    @InjectRepository(Justificacion)
    private readonly justificacion_repo?: Repository<Justificacion>,
  ) {}

  async obtenerEstadisticas(
    supervisor_id?: number,
    fecha_inicio?: string,
    fecha_fin?: string,
    usuario?: Usuario,
  ): Promise<EstadisticasDashboard> {
    const where_becario = supervisor_id ? { supervisor_id } : {};
    const [
      becarios_raw,
      todas_asistencias,
      todas_solicitudes,
      evaluaciones_pendientes,
      todas_multas,
      todas_justificaciones,
    ] = await Promise.all([
      this.becario_repo.find({ where: where_becario, relations: { usuario: true } }),
      this.asistencia_repo.find({ relations: { becario: { usuario: true } } }),
      this.pasajes_repo.find(),
      this.evaluacion_repo.count({ where: { estado: EstadoEvaluacion.PENDIENTE } }),
      this.multa_repo && typeof this.multa_repo.find === 'function'
        ? this.multa_repo.find({ relations: { asistencia: true } })
        : Promise.resolve([]),
      this.justificacion_repo && typeof this.justificacion_repo.find === 'function'
        ? this.justificacion_repo.find()
        : Promise.resolve([]),
    ]);

    let becarios = becarios_raw;
    if (supervisor_id && (becarios.length === 0 || becarios.length >= 15)) {
      const designados = await obtenerBecariosDesignadosMentor(
        this.becario_repo,
        usuario,
        supervisor_id,
      );
      if (designados.length > 0) {
        becarios = designados;
      }
    }

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

    const justificaciones_aprobadas = (todas_justificaciones || []).filter((j) => {
      const es_aprobada =
        j.estado === EstadoJustificacion.APROBADA ||
        j.estado === EstadoJustificacion.APROBADO_ADMINISTRACION;
      if (!es_aprobada) return false;
      if (supervisor_id && !set_becarios_permitidos.has(j.becario_id)) return false;
      if (!j.fecha_incidencia) return false;
      const f = new Date(j.fecha_incidencia);
      if (d_inicio && f < d_inicio) return false;
      if (d_fin && f > d_fin) return false;
      return true;
    });

    const claves_permiso_aprobado = new Set<string>();
    const permisos_por_becario = new Map<number, Set<string>>();
    for (const j of justificaciones_aprobadas) {
      const f_str =
        j.fecha_incidencia instanceof Date
          ? j.fecha_incidencia.toISOString().split('T')[0]
          : String(j.fecha_incidencia).split('T')[0];
      claves_permiso_aprobado.add(`${j.becario_id}_${f_str}`);
      const set_fechas = permisos_por_becario.get(j.becario_id) || new Set<string>();
      set_fechas.add(f_str);
      permisos_por_becario.set(j.becario_id, set_fechas);
    }

    const tipo_por_asistencia = new Map<number, TipoAsistencia>();
    for (const a of todas_asistencias) {
      if (a.id && a.tipo) {
        tipo_por_asistencia.set(a.id, a.tipo);
      }
    }

    const multas_filtradas = todas_multas.filter((m) => {
      if (!m.es_institucional) return false;
      const tipo_asist =
        m.asistencia?.tipo ??
        (m.asistencia_id ? tipo_por_asistencia.get(m.asistencia_id) : undefined);
      if (tipo_asist && tipo_asist !== TipoAsistencia.ESCUELA_LIDERES) {
        return false;
      }
      if (!tipo_asist) {
        const motivo = (m.motivo || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        if (motivo.includes('practica') || motivo.includes('acciones de servicio')) {
          return false;
        }
      }
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
        dias_permiso_aprobado: number;
        horas_compensadas_permiso: number;
      }
    > = {};

    for (const b of becarios) {
      const cant_permisos = permisos_por_becario.get(b.id)?.size || 0;
      metricas_becario[b.id] = {
        nombre: b.usuario?.nombre || b.nombre || `Becario #${b.id}`,
        carrera: b.carrera || 'No especificada',
        total: 0,
        a_tiempo: 0,
        en_radio: 0,
        dias_permiso_aprobado: cant_permisos,
        horas_compensadas_permiso: Number((cant_permisos * 4.0).toFixed(2)),
      };
    }

    const permisos_contabilizados_en_asistencias = new Set<string>();

    for (const reg of asistencias) {
      const f_str = reg.fecha
        ? reg.fecha instanceof Date
          ? reg.fecha.toISOString().split('T')[0]
          : String(reg.fecha).split('T')[0]
        : '';
      const clave_permiso = `${reg.becario_id}_${f_str}`;
      const tiene_permiso = f_str !== '' && claves_permiso_aprobado.has(clave_permiso);
      if (tiene_permiso) {
        permisos_contabilizados_en_asistencias.add(clave_permiso);
      }

      const horas_base = Number(reg.horas_trabajadas || 0);
      const horas = tiene_permiso && horas_base === 0 ? 4.0 : horas_base;
      total_horas_acumuladas += horas;

      if (f_str) {
        const periodo_corte = obtenerPeriodoCorteDesdeFechaIso(f_str);
        const mes_num = periodo_corte ? Number(periodo_corte.slice(5, 7)) : Number(f_str.slice(5, 7));
        if (mes_num >= 1 && mes_num <= 12) {
          horas_por_mes[mes_num - 1] = (horas_por_mes[mes_num - 1] || 0) + horas;
        }
      }

      if (metricas_becario[reg.becario_id]) {
        metricas_becario[reg.becario_id].total += 1;
        if (reg.dentro_de_horario || tiene_permiso) {
          metricas_becario[reg.becario_id].a_tiempo += 1;
        }
        if (reg.dentro_de_radio || tiene_permiso) {
          metricas_becario[reg.becario_id].en_radio += 1;
        }
      }
    }

    for (const clave of claves_permiso_aprobado) {
      if (permisos_contabilizados_en_asistencias.has(clave)) continue;
      const [b_id_str, f_str] = clave.split('_');
      const b_id = Number(b_id_str);
      if (metricas_becario[b_id]) {
        metricas_becario[b_id].total += 1;
        metricas_becario[b_id].a_tiempo += 1;
        metricas_becario[b_id].en_radio += 1;
        total_horas_acumuladas += 4.0;
        const periodo_corte = obtenerPeriodoCorteDesdeFechaIso(f_str);
        const mes_num = periodo_corte ? Number(periodo_corte.slice(5, 7)) : Number(f_str.slice(5, 7));
        if (mes_num >= 1 && mes_num <= 12) {
          horas_por_mes[mes_num - 1] = (horas_por_mes[mes_num - 1] || 0) + 4.0;
        }
      }
    }

    const total_dias_permiso = claves_permiso_aprobado.size;
    const total_horas_compensadas = Number((total_dias_permiso * 4.0).toFixed(2));

    total_horas_acumuladas = Number(total_horas_acumuladas.toFixed(2));
    const promedio_horas_por_becario = total_becarios_activos > 0
      ? Number((total_horas_acumuladas / total_becarios_activos).toFixed(2))
      : 0;

    const tendencia_horas: ItemTendenciaMensualHoras[] = NOMBRES_MESES.map((mes, idx) => ({
      mes,
      horas: Number(horas_por_mes[idx].toFixed(2)),
    }));

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
        dias_permiso_aprobado: data.dias_permiso_aprobado,
        horas_compensadas_permiso: data.horas_compensadas_permiso,
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

    let evaluaciones_completadas = 0;
    if (typeof this.evaluacion_repo?.find === 'function') {
      try {
        const todas_evs = await this.evaluacion_repo.find();
        evaluaciones_completadas = todas_evs.filter(
          (e) =>
            e.estado === EstadoEvaluacion.COMPLETADO &&
            (!supervisor_id || set_becarios_permitidos.has(e.becario_id)),
        ).length;
      } catch {
        evaluaciones_completadas = 0;
      }
    }

    const total_a_tiempo = asistencias.filter((a) => a.dentro_de_horario).length;
    const porcentaje_puntualidad =
      asistencias.length > 0
        ? Number(((total_a_tiempo / asistencias.length) * 100).toFixed(1))
        : 0;

    return {
      metricas_generales: {
        total_becarios_activos,
        total_horas_acumuladas,
        promedio_horas_por_becario,
        evaluaciones_pendientes,
        solicitudes_pasajes_pendientes,
        total_multas_bs,
        dias_permiso_aprobado: total_dias_permiso,
        horas_compensadas_permiso: total_horas_compensadas,
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
      multas_recaudadas_bs: total_multas_bs,
      incidencias_multas: multas_filtradas.length,
      total_becarios: total_becarios_activos,
      evaluaciones_completadas,
      porcentaje_puntualidad,
      dias_permiso_aprobado: total_dias_permiso,
      horas_compensadas_permiso: total_horas_compensadas,
    };
  }

  async obtenerSeguimientoSemanal(
    supervisor_id?: number,
    fecha_referencia?: string | Date,
    usuario?: Usuario,
  ): Promise<SeguimientoSemanal> {
    const fecha_ref_iso = extraerFechaIsoSinDesfase(fecha_referencia);
    const bo = fecha_ref_iso
      ? (() => {
          const [anio, mes, dia] = fecha_ref_iso.split('-').map(Number);
          const dt = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
          return { anio, mes, dia, dia_semana: dt.getUTCDay() };
        })()
      : obtenerFechaHoraBolivia();

    const dif_lunes = bo.dia_semana === 0 ? -6 : 1 - bo.dia_semana;
    const fecha_lunes = new Date(Date.UTC(bo.anio, bo.mes - 1, bo.dia + dif_lunes, 12, 0, 0));
    const fecha_domingo = new Date(Date.UTC(bo.anio, bo.mes - 1, bo.dia + dif_lunes + 6, 12, 0, 0));

    const inicio_str = fecha_lunes.toISOString().split('T')[0];
    const fin_str = fecha_domingo.toISOString().split('T')[0];

    const where_becario = supervisor_id ? { supervisor_id } : {};
    let becarios = await this.becario_repo.find({
      where: where_becario,
      relations: { usuario: true },
      order: { id: 'ASC' },
    });
    if (supervisor_id && (becarios.length === 0 || becarios.length >= 15)) {
      const designados = await obtenerBecariosDesignadosMentor(
        this.becario_repo,
        usuario,
        supervisor_id,
      );
      if (designados.length > 0) {
        becarios = designados;
      }
    }

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

    const todas_justificaciones =
      this.justificacion_repo && typeof this.justificacion_repo.find === 'function'
        ? await this.justificacion_repo.find()
        : [];
    const permisos_semana_set = new Set<string>();
    const permisos_semana_por_becario = new Map<number, Set<string>>();

    for (const j of todas_justificaciones || []) {
      const es_aprobada =
        j.estado === EstadoJustificacion.APROBADA ||
        j.estado === EstadoJustificacion.APROBADO_ADMINISTRACION;
      if (!es_aprobada || !set_becarios.has(j.becario_id) || !j.fecha_incidencia) continue;
      const f_str =
        j.fecha_incidencia instanceof Date
          ? j.fecha_incidencia.toISOString().split('T')[0]
          : String(j.fecha_incidencia).split('T')[0];
      if (f_str >= inicio_str && f_str <= fin_str) {
        permisos_semana_set.add(`${j.becario_id}_${f_str}`);
        const set_f = permisos_semana_por_becario.get(j.becario_id) || new Set<string>();
        set_f.add(f_str);
        permisos_semana_por_becario.set(j.becario_id, set_f);
      }
    }

    const becarios_con_retraso: ItemBecarioConRetraso[] = [];
    for (const a of asistencias_filtradas) {
      const f_str = a.fecha instanceof Date ? a.fecha.toISOString().split('T')[0] : String(a.fecha);
      if (permisos_semana_set.has(`${a.becario_id}_${f_str}`)) {
        continue;
      }
      const tiene_retraso = (a.minutos_retraso && a.minutos_retraso > 0) || a.dentro_de_horario === false;
      if (tiene_retraso && a.hora_ingreso) {
        const b = mapa_becarios.get(a.becario_id) || a.becario;
        const minutos = a.minutos_retraso > 0 ? a.minutos_retraso : 1;
        becarios_con_retraso.push({
          becario: {
            id: b ? b.id : a.becario_id,
            nombre: b?.usuario?.nombre || b?.nombre || `Becario #${a.becario_id}`,
            carrera: b?.carrera || 'No registrada',
            universidad: b?.universidad || 'Universidad',
            unidad: b?.unidad || null,
          },
          hora_ingreso: a.hora_ingreso,
          hora_prevista: a.hora_prevista || '08:00',
          minutos_retraso: a.minutos_retraso || minutos,
          fecha: f_str,
        });
      }
    }

    const asistencias_por_becario = new Map<
      number,
      { total: number; ultima_fecha?: string; fechas_vistas: Set<string> }
    >();
    for (const a of asistencias_filtradas) {
      if (a.hora_ingreso) {
        const actual = asistencias_por_becario.get(a.becario_id) || {
          total: 0,
          fechas_vistas: new Set<string>(),
        };
        const f_str = a.fecha instanceof Date ? a.fecha.toISOString().split('T')[0] : String(a.fecha);
        actual.total += 1;
        actual.fechas_vistas.add(f_str);
        if (!actual.ultima_fecha || f_str > actual.ultima_fecha) {
          actual.ultima_fecha = f_str;
        }
        asistencias_por_becario.set(a.becario_id, actual);
      }
    }

    for (const [b_id, fechas_permiso] of permisos_semana_por_becario.entries()) {
      const actual = asistencias_por_becario.get(b_id) || {
        total: 0,
        fechas_vistas: new Set<string>(),
      };
      for (const f_str of fechas_permiso) {
        if (!actual.fechas_vistas.has(f_str)) {
          actual.total += 1;
          actual.fechas_vistas.add(f_str);
        }
        if (!actual.ultima_fecha || f_str > actual.ultima_fecha) {
          actual.ultima_fecha = f_str;
        }
      }
      asistencias_por_becario.set(b_id, actual);
    }

    const asistieron: ItemBecarioAsistenciaSemanal[] = [];
    const no_asistieron: ItemBecarioAsistenciaSemanal[] = [];

    for (const b of becarios) {
      const reg = asistencias_por_becario.get(b.id);
      const dias_permiso = permisos_semana_por_becario.get(b.id)?.size || 0;
      const horas_compensadas = Number((dias_permiso * 4.0).toFixed(2));
      const info: InfoBecarioResumen = {
        id: b.id,
        nombre: b.usuario?.nombre || b.nombre || `Becario #${b.id}`,
        carrera: b.carrera || 'No registrada',
        universidad: b.universidad || 'Universidad',
        unidad: b.unidad || null,
      };

      if (reg && reg.total > 0) {
        asistieron.push({
          becario: info,
          total_asistencias: reg.total,
          ultima_fecha: reg.ultima_fecha,
          dias_permiso_aprobado: dias_permiso,
          horas_compensadas_permiso: horas_compensadas,
        });
      } else {
        no_asistieron.push({
          becario: info,
          total_asistencias: 0,
          dias_permiso_aprobado: dias_permiso,
          horas_compensadas_permiso: horas_compensadas,
        });
      }
    }

    const total_dias_permiso_semana = permisos_semana_set.size;
    const total_horas_compensadas_semana = Number((total_dias_permiso_semana * 4.0).toFixed(2));

    const conteo: ConteoSeguimientoSemanal = {
      total: becarios.length,
      asistieron: asistieron.length,
      no_asistieron: no_asistieron.length,
      dias_permiso_aprobado: total_dias_permiso_semana,
      horas_compensadas_permiso: total_horas_compensadas_semana,
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
      dias_permiso_aprobado: total_dias_permiso_semana,
      horas_compensadas_permiso: total_horas_compensadas_semana,
    };
  }
}
