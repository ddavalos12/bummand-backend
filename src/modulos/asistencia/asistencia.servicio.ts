import { Injectable, NotFoundException, ConflictException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia, TipoAsistencia } from './entidades/registro-asistencia.entidad';
import { Multa } from './entidades/multa.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';
import { ConfirmarOrganizadorDto } from './dtos/confirmar-organizador.dto';
import { Becario } from '../becarios/entidades/becario.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { NotificacionesServicio } from '../notificaciones/notificaciones.servicio';
import { calcularDistanciaMetros } from '../../utilidades/geo.utilidad';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';

const MARGEN_GPS_MAXIMO_M = 10;

@Injectable()
export class AsistenciaServicio {
  constructor(
    @InjectRepository(RegistroAsistencia)
    private readonly asistenciaRepositorio: Repository<RegistroAsistencia>,
    @InjectRepository(Becario)
    private readonly becarioRepositorio: Repository<Becario>,
    @Optional()
    @InjectRepository(LugarPractica)
    private readonly lugarRepositorio?: Repository<LugarPractica>,
    @Optional()
    @InjectRepository(Multa)
    private readonly multaRepositorio?: Repository<Multa>,
    @Optional()
    private readonly notificacionesServicio?: NotificacionesServicio,
    @Optional()
    private readonly tiempoRealGateway?: TiempoRealGateway,
  ) {}

  private obtenerHorarioDelDia(
    horario_semanal: Record<string, string> | null | undefined,
    dia_semana: number,
  ): string | null {
    if (!horario_semanal || typeof horario_semanal !== 'object') {
      return null;
    }
    const claves_posibles: Record<number, string[]> = {
      0: ['dom', 'domingo'],
      1: ['lun', 'lunes'],
      2: ['mar', 'martes'],
      3: ['mie', 'miercoles', 'miércoles'],
      4: ['jue', 'jueves'],
      5: ['vie', 'viernes'],
      6: ['sab', 'sabado', 'sábado'],
    };
    const claves = claves_posibles[dia_semana] || [];
    for (const c of claves) {
      const v = horario_semanal[c] || horario_semanal[c.toUpperCase()];
      if (typeof v === 'string' && v.trim() !== '' && v.trim() !== '—' && v.trim() !== '-') {
        return v.trim();
      }
    }
    return null;
  }

  private verificarPuntualidad(
    tipo: TipoAsistencia,
    becario: Becario,
    ahora: Date = new Date(),
  ): { dentro: boolean; minutos_retraso: number; hora_prevista: string | null; advertencia?: string } {
    if (tipo === TipoAsistencia.ESCUELA_LIDERES) {
      const hora_prevista = '14:30';
      const limite = new Date(ahora);
      limite.setHours(14, 30, 0, 0);

      if (ahora > limite) {
        const diff_minutos = Math.round((ahora.getTime() - limite.getTime()) / 60000);
        return {
          dentro: false,
          minutos_retraso: diff_minutos,
          hora_prevista,
          advertencia: `⚠ Ingreso registrado con retraso de ${diff_minutos} min (hora prevista ${hora_prevista})`,
        };
      } else {
        return {
          dentro: true,
          minutos_retraso: 0,
          hora_prevista,
          advertencia: `✓ Ingreso puntual — dentro del horario (${hora_prevista})`,
        };
      }
    }

    if (tipo === TipoAsistencia.PRACTICAS) {
      const dia_semana = ahora.getDay();
      const horario_dia = this.obtenerHorarioDelDia(becario.horario_semanal, dia_semana);

      if (!horario_dia) {
        return {
          dentro: true,
          minutos_retraso: 0,
          hora_prevista: null,
          advertencia: 'Sin horario de apoyo asignado para hoy',
        };
      }

      const hora_inicio = horario_dia.split('-')[0].trim();
      const partes = hora_inicio.split(':');
      if (partes.length < 2) {
        return {
          dentro: true,
          minutos_retraso: 0,
          hora_prevista: hora_inicio,
        };
      }

      const h_prev = parseInt(partes[0], 10);
      const m_prev = parseInt(partes[1], 10);
      const limite = new Date(ahora);
      limite.setHours(h_prev, m_prev, 0, 0);

      if (ahora > limite) {
        const diff_minutos = Math.round((ahora.getTime() - limite.getTime()) / 60000);
        return {
          dentro: false,
          minutos_retraso: diff_minutos,
          hora_prevista: hora_inicio,
          advertencia: `⚠ Ingreso registrado con retraso de ${diff_minutos} min (hora prevista ${hora_inicio})`,
        };
      } else {
        return {
          dentro: true,
          minutos_retraso: 0,
          hora_prevista: hora_inicio,
          advertencia: `✓ Ingreso puntual — dentro del horario (${hora_inicio})`,
        };
      }
    }

    return {
      dentro: true,
      minutos_retraso: 0,
      hora_prevista: null,
    };
  }

  private verificarHorario(tipo: TipoAsistencia, fecha_hora: Date = new Date()): { dentro: boolean; advertencia?: string } {
    const dia_semana = fecha_hora.getDay();
    const horas = fecha_hora.getHours();
    const minutos = fecha_hora.getMinutes();
    const tiempo_decimal = horas + minutos / 60;

    if (tipo === TipoAsistencia.ESCUELA_LIDERES) {
      const es_viernes = dia_semana === 5;
      const en_ventana = tiempo_decimal >= 14.0 && tiempo_decimal <= 16.5;
      if (es_viernes && en_ventana) {
        return { dentro: true };
      }
      return {
        dentro: false,
        advertencia: 'Alerta: Escuela de Líderes se realiza los viernes a las 14:30. Marcación registrada fuera de horario institucional.',
      };
    }

    if (tipo === TipoAsistencia.PRACTICAS) {
      const es_laboral = dia_semana >= 1 && dia_semana <= 6;
      const en_jornada = tiempo_decimal >= 7.5 && tiempo_decimal <= 19.0;
      if (es_laboral && en_jornada) {
        return { dentro: true };
      }
      return {
        dentro: false,
        advertencia: 'Alerta: Marcación de prácticas realizada fuera de la jornada institucional autorizada.',
      };
    }

    return { dentro: true };
  }

  async registrarIngreso(dto: CoordenadasDto): Promise<{ registro: RegistroAsistencia; mensaje: string; advertencia?: string }> {
    const becario = await this.becarioRepositorio.findOne({
      where: [{ id: dto.becario_id }, { usuario_id: dto.becario_id }],
      relations: { lugar_practica: true },
    });

    if (!becario) throw new NotFoundException('Becario no encontrado');
    if (!becario.lugar_practica && !dto.lugar_practica_id) {
      throw new ConflictException('Becario sin lugar de prácticas asignado');
    }

    const tipo = dto.tipo || TipoAsistencia.PRACTICAS;
    const ahora = new Date();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ingresoAbierto = await this.asistenciaRepositorio.findOne({
      where: { becario_id: becario.id, fecha: hoy, tipo, hora_salida: null as any },
    });

    if (ingresoAbierto) {
      throw new ConflictException('Ya existe un ingreso abierto hoy. Registra la salida primero.');
    }

    // Determinación de sede o agencia objetivo (soporte multisede y rotación de agencias)
    let lugar_objetivo: LugarPractica | null = null;

    if (dto.lugar_practica_id && this.lugarRepositorio) {
      lugar_objetivo = await this.lugarRepositorio.findOne({ where: { id: dto.lugar_practica_id } });
    }

    if (!lugar_objetivo) {
      lugar_objetivo = becario.lugar_practica;
    }

    const margen = Math.min(Math.max(dto.precision || 0, 0), MARGEN_GPS_MAXIMO_M);
    let distancia_m = lugar_objetivo
      ? calcularDistanciaMetros(dto.latitud, dto.longitud, Number(lugar_objetivo.latitud), Number(lugar_objetivo.longitud))
      : 999999;

    let dentro_de_radio = dto.simulada !== true && lugar_objetivo !== null && distancia_m <= lugar_objetivo.radio_tolerancia_m + margen;

    // Si no está dentro del radio de la sede predeterminada, autodetectar si está en otra agencia autorizada de Diaconía
    if (!dentro_de_radio && this.lugarRepositorio) {
      const sedes_institucionales = await this.lugarRepositorio.find();
      for (const sede of sedes_institucionales) {
        const d = calcularDistanciaMetros(dto.latitud, dto.longitud, Number(sede.latitud), Number(sede.longitud));
        if (d <= sede.radio_tolerancia_m + margen && dto.simulada !== true) {
          lugar_objetivo = sede;
          distancia_m = d;
          dentro_de_radio = true;
          break;
        }
      }
    }

    const evaluacion_horario = this.verificarPuntualidad(tipo, becario, ahora);

    const registro = this.asistenciaRepositorio.create({
      becario_id: becario.id,
      tipo,
      fecha: hoy,
      hora_ingreso: ahora.toTimeString().split(' ')[0], // HH:MM:SS
      lat_ingreso: dto.latitud,
      lng_ingreso: dto.longitud,
      bloque: dto.bloque || null,
      confirmado_organizador: false,
      dentro_de_radio,
      dentro_de_horario: evaluacion_horario.dentro,
      minutos_retraso: evaluacion_horario.minutos_retraso,
      hora_prevista: evaluacion_horario.hora_prevista,
    });

    await this.asistenciaRepositorio.save(registro);

    // Motor de multas: Viernes (Escuela de Líderes) posterior a 14:30 + 5 min tolerancia (14:35)
    const es_viernes = ahora.getDay() === 5;
    const es_escuela_lideres = tipo === TipoAsistencia.ESCUELA_LIDERES;
    if (es_viernes || es_escuela_lideres) {
      const limite_tolerancia = new Date(ahora);
      limite_tolerancia.setHours(14, 35, 0, 0);

      if (ahora > limite_tolerancia) {
        const limite_oficial = new Date(ahora);
        limite_oficial.setHours(14, 30, 0, 0);
        const minutos_retraso_multa = Math.max(
          Math.round((ahora.getTime() - limite_oficial.getTime()) / 60000),
          1,
        );
        const monto_bs = minutos_retraso_multa * 10;

        if (this.multaRepositorio) {
          const nueva_multa = this.multaRepositorio.create({
            becario_id: becario.id,
            asistencia_id: registro.id,
            minutos_retraso: minutos_retraso_multa,
            monto_bs,
            motivo: `Retraso de ${minutos_retraso_multa} min en Escuela de Líderes (tolerancia máxima: 14:35)`,
            fecha_aplicacion: ahora,
            es_institucional: true,
          });
          await this.multaRepositorio.save(nueva_multa);

          if (this.notificacionesServicio && becario.usuario_id) {
            try {
              await this.notificacionesServicio.crear({
                usuario_id: becario.usuario_id,
                tipo: 'multa_retraso',
                mensaje: `Se ha emitido una multa institucional de Bs ${monto_bs} por retraso de ${minutos_retraso_multa} min en Escuela de Líderes.`,
              });
            } catch {
              // Silencioso ante fallos de notificación
            }
          }
        }
      }
    }

    this.tiempoRealGateway?.notificarAsistencia({ accion: 'ingreso', registro });

    const nombre_sede = lugar_objetivo ? lugar_objetivo.nombre : 'Sede institucional';
    let mensaje = dentro_de_radio
      ? `Ingreso registrado correctamente en ${nombre_sede}`
      : `Ingreso registrado fuera de geocerca en ${nombre_sede} (${Math.round(distancia_m)}m)`;

    if (evaluacion_horario.advertencia) {
      mensaje += `. ${evaluacion_horario.advertencia}`;
    }

    return {
      registro,
      mensaje,
      advertencia: evaluacion_horario.advertencia,
    };
  }

  async registrarSalida(dto: CoordenadasDto): Promise<{ registro: RegistroAsistencia; mensaje: string }> {
    const tipo = dto.tipo || TipoAsistencia.PRACTICAS;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const becario = await this.becarioRepositorio.findOne({
      where: [{ id: dto.becario_id }, { usuario_id: dto.becario_id }],
    });
    const id_busqueda = becario ? becario.id : dto.becario_id;

    const registro_abierto = await this.asistenciaRepositorio.findOne({
      where: { becario_id: id_busqueda, fecha: hoy, tipo, hora_salida: null as any },
    });

    if (!registro_abierto) {
      throw new NotFoundException('No existe un ingreso abierto hoy.');
    }

    registro_abierto.hora_salida = new Date().toTimeString().split(' ')[0];
    registro_abierto.lat_salida = dto.latitud;
    registro_abierto.lng_salida = dto.longitud;
    
    // Cálculo básico de horas
    const [h_i, m_i] = registro_abierto.hora_ingreso.split(':').map(Number);
    const [h_s, m_s] = registro_abierto.hora_salida.split(':').map(Number);
    const horas = (h_s + m_s / 60) - (h_i + m_i / 60);
    registro_abierto.horas_trabajadas = parseFloat(horas.toFixed(2));

    await this.asistenciaRepositorio.save(registro_abierto);

    this.tiempoRealGateway?.notificarAsistencia({ accion: 'salida', registro: registro_abierto });

    return { registro: registro_abierto, mensaje: 'Salida registrada correctamente' };
  }

  async confirmarOrganizador(
    dto: ConfirmarOrganizadorDto,
  ): Promise<{ mensaje: string; confirmados: number }> {
    const ids: number[] = [];
    if (dto.asistencia_ids && Array.isArray(dto.asistencia_ids)) {
      ids.push(...dto.asistencia_ids);
    }
    if (dto.asistencia_id) {
      ids.push(dto.asistencia_id);
    }

    if (ids.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos un ID de asistencia para confirmar');
    }

    let confirmados = 0;
    for (const id of ids) {
      const reg = await this.asistenciaRepositorio.findOne({ where: { id } });
      if (reg) {
        reg.confirmado_organizador = true;
        await this.asistenciaRepositorio.save(reg);
        confirmados++;
      }
    }

    return {
      mensaje: `Presencia física confirmada por el organizador para ${confirmados} registro(s)`,
      confirmados,
    };
  }

  async obtenerMultas(): Promise<Multa[]> {
    if (!this.multaRepositorio) return [];
    return this.multaRepositorio.find({
      relations: { becario: { usuario: true }, asistencia: true },
      order: { fecha_aplicacion: 'DESC' },
    });
  }

  async obtenerMisMultas(usuario_id: number): Promise<Multa[]> {
    if (!this.multaRepositorio) return [];
    const becario = await this.becarioRepositorio.findOne({ where: { usuario_id } });
    if (!becario) return [];
    return this.multaRepositorio.find({
      where: { becario_id: becario.id },
      relations: { asistencia: true },
      order: { fecha_aplicacion: 'DESC' },
    });
  }

  async obtenerTodos(): Promise<RegistroAsistencia[]> {
    return this.asistenciaRepositorio.find({
      relations: { becario: { usuario: true } },
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }
}

