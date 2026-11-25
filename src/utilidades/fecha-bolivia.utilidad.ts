export const ZONA_HORARIA_BOLIVIA = 'America/La_Paz';

export const NOMBRES_MESES_ESPANOL: readonly string[] = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const NOMBRES_MESES_CORTOS_ESPANOL: readonly string[] = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

export interface FechaHoraBolivia {
  anio: number;
  mes: number;
  dia: number;
  dia_semana: number;
  horas: number;
  minutos: number;
  segundos: number;
  fecha_iso: string;
  hora_hhmmss: string;
}

export function obtenerFechaHoraBolivia(base: Date = new Date()): FechaHoraBolivia {
  try {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA_HORARIA_BOLIVIA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(base);

    const obtener = (tipo: string) =>
      Number(partes.find((p) => p.type === tipo)?.value ?? 0);

    const anio = obtener('year');
    const mes = obtener('month');
    const dia = obtener('day');
    const horas_raw = obtener('hour');
    const horas = horas_raw === 24 ? 0 : horas_raw;
    const minutos = obtener('minute');
    const segundos = obtener('second');
    const fecha_iso = `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const hora_hhmmss = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    const dia_semana = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0)).getUTCDay();

    return {
      anio,
      mes,
      dia,
      dia_semana,
      horas,
      minutos,
      segundos,
      fecha_iso,
      hora_hhmmss,
    };
  } catch {
    const fecha_iso = base.toISOString().split('T')[0];
    return {
      anio: base.getFullYear(),
      mes: base.getMonth() + 1,
      dia: base.getDate(),
      dia_semana: base.getDay(),
      horas: base.getHours(),
      minutos: base.getMinutes(),
      segundos: base.getSeconds(),
      fecha_iso,
      hora_hhmmss: base.toTimeString().split(' ')[0],
    };
  }
}

export const DIA_CORTE_MENSUAL_BANCARIO = 24;

export function avanzarMesPeriodo(anio: number, mes: number, delta: number): { anio: number; mes: number } {
  const indice = anio * 12 + (mes - 1) + delta;
  return {
    anio: Math.floor(indice / 12),
    mes: ((indice % 12) + 12) % 12 + 1,
  };
}

export function obtenerPeriodoCorteDesdeComponentes(anio: number, mes: number, dia: number): string {
  const destino = dia >= DIA_CORTE_MENSUAL_BANCARIO ? avanzarMesPeriodo(anio, mes, 1) : { anio, mes };
  return `${String(destino.anio).padStart(4, '0')}-${String(destino.mes).padStart(2, '0')}`;
}

export function obtenerPeriodoCorteDesdeFechaIso(fecha_iso?: string | null): string | null {
  const coincidencia = (fecha_iso || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!coincidencia) return null;
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return obtenerPeriodoCorteDesdeComponentes(anio, mes, dia);
}

export function obtenerPeriodoActualBolivia(base: Date = new Date()): string {
  const bo = obtenerFechaHoraBolivia(base);
  return obtenerPeriodoCorteDesdeComponentes(bo.anio, bo.mes, bo.dia);
}

export function obtenerNombreMesAnioBolivia(base: Date = new Date()): string {
  return obtenerNombrePeriodoDesdeIso(obtenerPeriodoActualBolivia(base));
}

export function obtenerNombrePeriodoDesdeIso(periodo: string): string {
  const coincidencia = (periodo || '').trim().match(/^(\d{4})-(\d{1,2})/);
  if (!coincidencia) {
    return periodo;
  }
  const anio = Number(coincidencia[1]);
  const mes_num = Number(coincidencia[2]);
  if (mes_num < 1 || mes_num > 12) {
    return periodo;
  }
  return `${NOMBRES_MESES_ESPANOL[mes_num - 1]} ${anio}`;
}

export function obtenerRangoMesBolivia(
  anio: number,
  mes: number,
): { fecha_inicio: string; fecha_fin: string } {
  const anterior = avanzarMesPeriodo(anio, mes, -1);
  const inicio_mes_pad = String(anterior.mes).padStart(2, '0');
  const fin_mes_pad = String(mes).padStart(2, '0');
  return {
    fecha_inicio: `${String(anterior.anio).padStart(4, '0')}-${inicio_mes_pad}-${String(DIA_CORTE_MENSUAL_BANCARIO).padStart(2, '0')}`,
    fecha_fin: `${String(anio).padStart(4, '0')}-${fin_mes_pad}-${String(DIA_CORTE_MENSUAL_BANCARIO - 1).padStart(2, '0')}`,
  };
}

export function extraerFechaIsoSinDesfase(
  valor?: Date | string | null,
): string | null {
  if (!valor) return null;
  if (typeof valor === 'string') {
    const coincidencia = valor.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (coincidencia) return coincidencia[1];
  }
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(fecha.getTime())) return null;
  return fecha.toISOString().slice(0, 10);
}

export function calcularSegundosEntreHoras(
  hora_ingreso?: string | null,
  hora_salida?: string | null,
): number {
  if (!hora_ingreso || !hora_salida) return 0;
  const partes_ing = hora_ingreso.trim().split(':').map(Number);
  const partes_sal = hora_salida.trim().split(':').map(Number);
  if (partes_ing.length < 2 || partes_sal.length < 2) return 0;
  const [h_i, m_i, s_i = 0] = partes_ing;
  const [h_s, m_s, s_s = 0] = partes_sal;
  if ([h_i, m_i, s_i, h_s, m_s, s_s].some((n) => Number.isNaN(n))) return 0;
  const diff = h_s * 3600 + m_s * 60 + s_s - (h_i * 3600 + m_i * 60 + s_i);
  return diff > 0 ? diff : 0;
}

export function formatearSegundosAHhmmss(total_segundos: number): string {
  const signo = total_segundos < 0 ? '-' : '';
  const abs = Math.max(0, Math.round(Math.abs(total_segundos)));
  const horas = Math.floor(abs / 3600);
  const minutos = Math.floor((abs % 3600) / 60);
  const segundos = abs % 60;
  return `${signo}${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

export function formatearHorasDecimalAHhmmss(horas?: number | null): string {
  if (horas === null || horas === undefined || Number.isNaN(Number(horas))) {
    return '00:00:00';
  }
  return formatearSegundosAHhmmss(Math.round(Number(horas) * 3600));
}
