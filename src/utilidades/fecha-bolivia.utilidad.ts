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

export function obtenerPeriodoActualBolivia(base: Date = new Date()): string {
  const bo = obtenerFechaHoraBolivia(base);
  return `${String(bo.anio).padStart(4, '0')}-${String(bo.mes).padStart(2, '0')}`;
}

export function obtenerNombreMesAnioBolivia(base: Date = new Date()): string {
  const bo = obtenerFechaHoraBolivia(base);
  return `${NOMBRES_MESES_ESPANOL[bo.mes - 1]} ${bo.anio}`;
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
  const mes_pad = String(mes).padStart(2, '0');
  const ultimo_dia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return {
    fecha_inicio: `${anio}-${mes_pad}-01`,
    fecha_fin: `${anio}-${mes_pad}-${String(ultimo_dia).padStart(2, '0')}`,
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
