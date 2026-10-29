import { Injectable, NotFoundException, ConflictException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia, TipoAsistencia, EstadoAprobacionAsistencia } from './entidades/registro-asistencia.entidad';
import { Multa } from './entidades/multa.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';
import { ConfirmarOrganizadorDto } from './dtos/confirmar-organizador.dto';
import { RegistrarAsistenciaManualDto } from './dtos/registrar-asistencia-manual.dto';
import { RectificarAsistenciaDto } from './dtos/rectificar-asistencia.dto';
import { RevisarSupervisorAsistenciaDto, AprobarAdminAsistenciaDto } from './dtos/revisar-asistencia.dto';
import { Becario } from '../becarios/entidades/becario.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { Iglesia } from '../iglesias/entidades/iglesia.entidad';
import { Justificacion, EstadoJustificacion, TipoIncidencia } from '../justificaciones/entidades/justificacion.entidad';
import { Evento, TipoEvento, EstadoEvento } from '../eventos/entidades/evento.entidad';
import { NotificacionesServicio } from '../notificaciones/notificaciones.servicio';
import { calcularDistanciaMetros } from '../../utilidades/geo.utilidad';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';

const MARGEN_GPS_MAXIMO_M = 10;
export const META_HORAS_SEMANAL = 9;
export const META_HORAS_MENSUAL = 36;

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
    @InjectRepository(Iglesia)
    private readonly iglesiaRepositorio?: Repository<Iglesia>,
    @Optional()
    @InjectRepository(Multa)
    private readonly multaRepositorio?: Repository<Multa>,
    @Optional()
    @InjectRepository(Justificacion)
    private readonly justificacionRepositorio?: Repository<Justificacion>,
    @Optional()
    @InjectRepository(Evento)
    private readonly eventoRepositorio?: Repository<Evento>,
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
          advertencia: `Horario semanal flexible de prácticas (meta: ${META_HORAS_SEMANAL}h/sem · ${META_HORAS_MENSUAL}h/mes)`,
        };
      }

      const hora_inicio = horario_dia.split('-')[0].trim();
      return {
        dentro: true,
        minutos_retraso: 0,
        hora_prevista: hora_inicio || null,
        advertencia: `✓ Ingreso puntual — dentro del horario flexible (${hora_inicio} · meta ${META_HORAS_SEMANAL}h/sem)`,
      };
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
      relations: { lugar_practica: true, iglesia: true },
    });

    if (!becario) throw new NotFoundException('Becario no encontrado');
    const tipo = dto.tipo || TipoAsistencia.PRACTICAS;
    if (tipo === TipoAsistencia.PRACTICAS && !becario.lugar_practica && !dto.lugar_practica_id) {
      throw new ConflictException('Becario sin lugar de prácticas asignado');
    }

    const ahora = new Date();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ingresoAbierto = await this.asistenciaRepositorio.findOne({
      where: { becario_id: becario.id, fecha: hoy, tipo, hora_salida: null as any },
    });

    if (ingresoAbierto) {
      throw new ConflictException('Ya existe un ingreso abierto hoy. Registra la salida primero.');
    }

    // Selección dinámica de la geocerca objetivo según modalidad de marcación
    const margen = Math.min(Math.max(dto.precision || 0, 0), MARGEN_GPS_MAXIMO_M);
    let nombre_recinto_objetivo = 'Sede institucional';
    let distancia_m = 999999;
    let dentro_de_radio = false;
    let evento_objetivo_id: number | null = null;

    if (tipo === TipoAsistencia.ACCIONES_SERVICIO) {
      // 1. Modalidad Acciones de Servicio:
      // Busca primero si existe un Evento por dto.evento_id o activo para la fecha actual con TipoEvento.SERVICIO_DIACONAL (estado != EstadoEvento.CANCELADO)
      let evento_encontrado: Evento | null = null;
      if (this.eventoRepositorio) {
        if (dto.evento_id) {
          evento_encontrado = await this.eventoRepositorio.findOne({
            where: { id: dto.evento_id },
          });
        }
        if (!evento_encontrado) {
          const hoyStr = ahora.toISOString().split('T')[0];
          const eventos_hoy = await this.eventoRepositorio.find({
            where: {
              tipo_evento: TipoEvento.SERVICIO_DIACONAL,
            },
          });
          evento_encontrado =
            eventos_hoy.find((ev) => {
              const evFechaStr =
                ev.fecha instanceof Date
                  ? ev.fecha.toISOString().split('T')[0]
                  : String(ev.fecha).split('T')[0];
              return evFechaStr === hoyStr && ev.estado !== EstadoEvento.CANCELADO;
            }) || null;
        }
      }

      if (
        evento_encontrado &&
        evento_encontrado.latitud !== null &&
        evento_encontrado.latitud !== undefined &&
        evento_encontrado.longitud !== null &&
        evento_encontrado.longitud !== undefined
      ) {
        distancia_m = calcularDistanciaMetros(
          dto.latitud,
          dto.longitud,
          Number(evento_encontrado.latitud),
          Number(evento_encontrado.longitud),
        );
        nombre_recinto_objetivo =
          evento_encontrado.titulo ||
          evento_encontrado.direccion_referencia ||
          'Acción de Servicio Diaconal';
        const radio = evento_encontrado.radio_tolerancia_m || 100;
        dentro_de_radio = dto.simulada !== true && distancia_m <= radio + margen;
        evento_objetivo_id = evento_encontrado.id;
      } else {
        // Fallback contra la iglesia del becario o catálogo eclesial
        const iglesia = becario.iglesia;
        if (
          iglesia &&
          iglesia.latitud !== null &&
          iglesia.latitud !== undefined &&
          iglesia.longitud !== null &&
          iglesia.longitud !== undefined
        ) {
          distancia_m = calcularDistanciaMetros(
            dto.latitud,
            dto.longitud,
            Number(iglesia.latitud),
            Number(iglesia.longitud),
          );
          nombre_recinto_objetivo = iglesia.nombre;
          const radio = iglesia.radio_tolerancia_m || 60;
          dentro_de_radio = dto.simulada !== true && distancia_m <= radio + margen;
        }

        // Autodetección si está en otra de las iglesias oficiales registradas en el sistema
        if (!dentro_de_radio && this.iglesiaRepositorio) {
          const todas_iglesias = await this.iglesiaRepositorio.find();
          for (const igl of todas_iglesias) {
            if (
              igl.latitud !== null &&
              igl.latitud !== undefined &&
              igl.longitud !== null &&
              igl.longitud !== undefined
            ) {
              const d = calcularDistanciaMetros(
                dto.latitud,
                dto.longitud,
                Number(igl.latitud),
                Number(igl.longitud),
              );
              if (d <= (igl.radio_tolerancia_m || 60) + margen && dto.simulada !== true) {
                distancia_m = d;
                nombre_recinto_objetivo = igl.nombre;
                dentro_de_radio = true;
                break;
              }
            }
          }
        }
      }
    } else if (tipo === TipoAsistencia.ESCUELA_LIDERES) {
      // 2. Modalidad Escuela de Líderes: valida contra la sede de formación institucional (Sede Central El Alto o sedes autorizadas)
      if (this.lugarRepositorio) {
        const sedes = (await this.lugarRepositorio.find()) || [];
        let sede_cercana = sedes[0] || null;
        let menor_distancia = 999999;
        for (const sede of sedes) {
          const d = calcularDistanciaMetros(dto.latitud, dto.longitud, Number(sede.latitud), Number(sede.longitud));
          if (d < menor_distancia) {
            menor_distancia = d;
            sede_cercana = sede;
          }
          if (d <= (sede.radio_tolerancia_m || 60) + margen && dto.simulada !== true) {
            distancia_m = d;
            nombre_recinto_objetivo = `Escuela de Líderes (${sede.nombre})`;
            dentro_de_radio = true;
            break;
          }
        }
        if (!dentro_de_radio && sede_cercana) {
          distancia_m = menor_distancia;
          nombre_recinto_objetivo = `Escuela de Líderes (${sede_cercana.nombre})`;
        }
      }
    } else {
      // 3. Modalidad Prácticas Preprofesionales: valida contra lugar_practica asignado o agencias autorizadas
      let lugar_objetivo: LugarPractica | null = null;
      if (dto.lugar_practica_id && this.lugarRepositorio) {
        lugar_objetivo = await this.lugarRepositorio.findOne({ where: { id: dto.lugar_practica_id } });
      }
      if (!lugar_objetivo) {
        lugar_objetivo = becario.lugar_practica;
      }
      if (lugar_objetivo) {
        nombre_recinto_objetivo = lugar_objetivo.nombre;
        distancia_m = calcularDistanciaMetros(dto.latitud, dto.longitud, Number(lugar_objetivo.latitud), Number(lugar_objetivo.longitud));
        dentro_de_radio = dto.simulada !== true && distancia_m <= lugar_objetivo.radio_tolerancia_m + margen;
      }

      // Soporte multisede y rotación de agencias Diaconía
      if (!dentro_de_radio && this.lugarRepositorio) {
        const sedes_institucionales = await this.lugarRepositorio.find();
        for (const sede of sedes_institucionales) {
          const d = calcularDistanciaMetros(dto.latitud, dto.longitud, Number(sede.latitud), Number(sede.longitud));
          if (d <= sede.radio_tolerancia_m + margen && dto.simulada !== true) {
            nombre_recinto_objetivo = sede.nombre;
            distancia_m = d;
            dentro_de_radio = true;
            break;
          }
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
      evento_id: evento_objetivo_id || dto.evento_id || null,
      estado_aprobacion: EstadoAprobacionAsistencia.PENDIENTE,
    });

    await this.asistenciaRepositorio.save(registro);

    // El motor de multas aplica EXCLUSIVAMENTE a la Escuela de Líderes de los días viernes
    const es_viernes = ahora.getDay() === 5;
    const es_escuela_lideres = tipo === TipoAsistencia.ESCUELA_LIDERES;
    if (es_escuela_lideres && es_viernes) {
      // Verificar si el becario tiene una justificación/permiso aprobado para hoy
      let tiene_permiso_aprobado = false;
      if (this.justificacionRepositorio) {
        const justificaciones_hoy = await this.justificacionRepositorio.find({
          where: { becario_id: becario.id },
        });
        const hoyStr = hoy.toISOString().split('T')[0];
        tiene_permiso_aprobado = justificaciones_hoy.some((j) => {
          const jFechaStr =
            j.fecha_incidencia instanceof Date
              ? j.fecha_incidencia.toISOString().split('T')[0]
              : String(j.fecha_incidencia).split('T')[0];
          return (
            jFechaStr === hoyStr &&
            (j.estado === EstadoJustificacion.APROBADA ||
              j.estado === EstadoJustificacion.APROBADO_ADMINISTRACION)
          );
        });
      }

      if (!tiene_permiso_aprobado) {
        const limite_tolerancia = new Date(ahora);
        limite_tolerancia.setHours(14, 35, 0, 0);

        if (ahora > limite_tolerancia) {
          const limite_oficial = new Date(ahora);
          limite_oficial.setHours(14, 30, 0, 0);
          const minutos_retraso_multa = Math.max(
            Math.round((ahora.getTime() - limite_oficial.getTime()) / 60000),
            1,
          );
          const { monto_bs, tramo } = this.calcularMultaEscuelaLideres(minutos_retraso_multa);

          if (this.multaRepositorio) {
            const nueva_multa = this.multaRepositorio.create({
              becario_id: becario.id,
              asistencia_id: registro.id,
              minutos_retraso: minutos_retraso_multa,
              monto_bs,
              motivo: `Retraso de ${minutos_retraso_multa} min en Escuela de Líderes (${tramo})`,
              fecha_aplicacion: ahora,
              es_institucional: true,
            });
            await this.multaRepositorio.save(nueva_multa);

            if (this.notificacionesServicio && becario.usuario_id) {
              try {
                await this.notificacionesServicio.crear({
                  usuario_id: becario.usuario_id,
                  tipo: 'multa_retraso',
                  mensaje: `Se ha emitido una multa institucional de Bs ${monto_bs} por retraso de ${minutos_retraso_multa} min en Escuela de Líderes (${tramo}).`,
                });
              } catch {
                // Silencioso ante fallos de notificación
              }
            }
          }
        }
      }
    }

    this.tiempoRealGateway?.notificarAsistencia({ accion: 'ingreso', registro });

    const nombre_sede = nombre_recinto_objetivo || 'Sede institucional';
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

  async registrarAsistenciaManual(
    dto: RegistrarAsistenciaManualDto,
  ): Promise<RegistroAsistencia> {
    const id_busqueda = dto.becario_id ?? dto.becarioId;
    if (!id_busqueda) {
      throw new BadRequestException('El identificador del becario es requerido');
    }

    const becario = await this.becarioRepositorio.findOne({
      where: [{ id: id_busqueda }, { usuario_id: id_busqueda }],
    });

    if (!becario) {
      throw new NotFoundException('Becario no encontrado');
    }

    const tipo = dto.tipo || TipoAsistencia.PRACTICAS;
    const hora_ingreso_raw = dto.hora_ingreso || dto.horaIngreso || '08:00';
    const hora_salida_raw = dto.hora_salida || dto.horaSalida || null;

    const hora_ingreso = hora_ingreso_raw.length === 5 ? `${hora_ingreso_raw}:00` : hora_ingreso_raw;
    const hora_salida = hora_salida_raw ? (hora_salida_raw.length === 5 ? `${hora_salida_raw}:00` : hora_salida_raw) : null;

    let horas_trabajadas: number | null = null;
    if (hora_salida) {
      const [h_i, m_i] = hora_ingreso.split(':').map(Number);
      const [h_s, m_s] = hora_salida.split(':').map(Number);
      const horas = (h_s + m_s / 60) - (h_i + m_i / 60);
      horas_trabajadas = horas > 0 ? parseFloat(horas.toFixed(2)) : 0;
    }

    const [anio, mes, dia] = dto.fecha.split('-').map(Number);
    const fecha_obj = new Date(anio, mes - 1, dia);

    const registro = this.asistenciaRepositorio.create({
      becario_id: becario.id,
      tipo,
      fecha: fecha_obj,
      hora_ingreso,
      hora_salida: hora_salida || undefined,
      horas_trabajadas: horas_trabajadas ?? undefined,
      dentro_de_radio: true,
      dentro_de_horario: true,
      minutos_retraso: 0,
      confirmado_organizador: true,
      es_registro_manual: true,
      motivo_contingencia: dto.motivo_contingencia || dto.motivoContingencia || 'Registro manual administrativo (contingencia sin megas/olvido)',
      lugar_practica_id: dto.lugar_practica_id ?? dto.lugarPracticaId ?? null,
      evento_id: dto.evento_id ?? dto.eventoId ?? null,
    });

    const guardado = await this.asistenciaRepositorio.save(registro);

    if (this.tiempoRealGateway) {
      if (typeof (this.tiempoRealGateway as any).notificarAsistenciaActualizada === 'function') {
        (this.tiempoRealGateway as any).notificarAsistenciaActualizada({ accion: 'manual', registro: guardado });
      }
      if (typeof this.tiempoRealGateway.notificarAsistencia === 'function') {
        this.tiempoRealGateway.notificarAsistencia({ accion: 'manual', registro: guardado });
      }
    }

    return Object.assign(guardado, {
      registro: guardado,
      mensaje: 'Asistencia manual registrada satisfactoriamente.',
    });
  }

  async obtenerPorUsuario(usuario_id?: number, becario_id?: number): Promise<RegistroAsistencia[]> {
    let id_becario = becario_id;
    if (!id_becario && usuario_id) {
      const becario = await this.becarioRepositorio.findOne({
        where: [{ usuario_id }, { id: usuario_id }],
      });
      if (becario) {
        id_becario = becario.id;
      } else {
        id_becario = usuario_id;
      }
    }
    if (!id_becario) {
      return [];
    }
    return this.asistenciaRepositorio.find({
      where: { becario_id: id_becario },
      relations: { becario: { usuario: true } },
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }

  async obtenerTodos(opciones?: {
    tipo?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    becario_id?: number;
  }): Promise<RegistroAsistencia[]> {
    const qb = this.asistenciaRepositorio
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.becario', 'becario')
      .leftJoinAndSelect('becario.usuario', 'usuario');

    if (opciones?.becario_id) {
      qb.andWhere('asistencia.becario_id = :bId', { bId: opciones.becario_id });
    }
    if (opciones?.tipo && opciones.tipo !== 'todas') {
      qb.andWhere('asistencia.tipo = :tipo', { tipo: opciones.tipo });
    }
    if (opciones?.fecha_inicio) {
      qb.andWhere('asistencia.fecha >= :inicio', { inicio: opciones.fecha_inicio });
    }
    if (opciones?.fecha_fin) {
      qb.andWhere('asistencia.fecha <= :fin', { fin: opciones.fecha_fin });
    }

    qb.orderBy('asistencia.fecha', 'DESC').addOrderBy('asistencia.created_at', 'DESC');
    return qb.getMany();
  }

  private calcularMultaEscuelaLideres(minutos: number): { monto_bs: number; tramo: string } {
    if (minutos <= 10) {
      return { monto_bs: 10, tramo: 'de 1 a 10 minutos (Bs 10)' };
    }
    if (minutos <= 30) {
      return { monto_bs: 20, tramo: 'de 11 a 30 minutos (Bs 20)' };
    }
    if (minutos <= 60) {
      return { monto_bs: 30, tramo: 'de 31 a 60 minutos (Bs 30)' };
    }
    return { monto_bs: 50, tramo: 'más de 60 minutos (Bs 50)' };
  }

  async obtenerHorasMensuales(): Promise<
    Array<{
      becario_id: number;
      usuario_id: number;
      nombre: string;
      correo: string;
      carrera: string;
      mes_actual: string;
      horas_mes_actual: number;
      meta_horas: number;
      meta_horas_semanal: number;
      horas_excedentes: number;
      porcentaje_cumplimiento: number;
      estado_meta: 'meta_superada' | 'cumplido' | 'en_progreso' | 'en_riesgo';
      total_horas: number;
      meses: Record<string, number>;
    }>
  > {
    const becarios = await this.becarioRepositorio.find({
      relations: {
        usuario: true,
        registros_asistencia: true,
      },
      order: { id: 'ASC' },
    });

    const ahora = new Date();
    const anio_actual = ahora.getFullYear();
    const mes_actual_num = String(ahora.getMonth() + 1).padStart(2, '0');
    const clave_mes_actual = `${anio_actual}-${mes_actual_num}`;

    return becarios.map((becario) => {
      const meses: Record<string, number> = {};
      let total_horas_acumuladas = 0;

      for (const registro of becario.registros_asistencia || []) {
        if (!registro.horas_trabajadas || !registro.fecha) continue;
        const fecha_str = typeof registro.fecha === 'string'
          ? (registro.fecha as string).substring(0, 7)
          : (registro.fecha as Date).toISOString().substring(0, 7);
        const horas = Number(registro.horas_trabajadas) || 0;
        meses[fecha_str] = Number(((meses[fecha_str] || 0) + horas).toFixed(2));
        total_horas_acumuladas = Number((total_horas_acumuladas + horas).toFixed(2));
      }

      const horas_mes_actual = meses[clave_mes_actual] || 0;
      const horas_excedentes = Math.max(
        0,
        parseFloat((horas_mes_actual - META_HORAS_MENSUAL).toFixed(2)),
      );
      const porcentaje_cumplimiento = Math.round(
        (horas_mes_actual / META_HORAS_MENSUAL) * 100,
      );
      const estado_meta: 'meta_superada' | 'cumplido' | 'en_progreso' | 'en_riesgo' =
        horas_mes_actual > META_HORAS_MENSUAL
          ? 'meta_superada'
          : horas_mes_actual === META_HORAS_MENSUAL
          ? 'cumplido'
          : horas_mes_actual >= 27
          ? 'en_progreso'
          : 'en_riesgo';

      return {
        becario_id: becario.id,
        usuario_id: becario.usuario_id || 0,
        nombre: becario.usuario?.nombre || becario.nombre || '',
        correo: becario.usuario?.correo || '',
        carrera: becario.carrera,
        mes_actual: clave_mes_actual,
        horas_mes_actual,
        meta_horas: META_HORAS_MENSUAL,
        meta_horas_semanal: META_HORAS_SEMANAL,
        horas_excedentes,
        porcentaje_cumplimiento,
        estado_meta,
        total_horas: total_horas_acumuladas,
        meses,
      };
    });
  }

  async rectificarHoraYJustificar(
    id: number,
    dto: RectificarAsistenciaDto,
    usuario_id?: number,
  ): Promise<RegistroAsistencia> {
    const registro = await this.asistenciaRepositorio.findOne({
      where: { id },
      relations: { becario: { usuario: true } },
    });

    if (!registro) {
      throw new NotFoundException(`Registro de asistencia #${id} no encontrado`);
    }

    // 1. Rectificar hora si se proporciona
    if (dto.hora_ingreso_nueva && dto.hora_ingreso_nueva.trim().length > 0) {
      registro.hora_ingreso = dto.hora_ingreso_nueva.trim();
    }

    // 2. Anulación o recálculo de minutos de retraso
    if (dto.anular_multa !== false) {
      registro.minutos_retraso = 0;
      registro.dentro_de_horario = true;
    }

    // 3. Documentar en el registro el motivo administrativo
    registro.motivo_contingencia = `Rectificación Administrativa: ${dto.motivo_justificacion}`;
    registro.confirmado_organizador = true;

    // 4. Condonar / anular multa asociada si existiese
    if (dto.anular_multa !== false && this.multaRepositorio) {
      try {
        const multas = await this.multaRepositorio.find({
          where: { asistencia_id: registro.id },
        });
        for (const m of multas) {
          m.monto_bs = 0;
          m.minutos_retraso = 0;
          m.motivo = `Anulada por Justificación Administrativa: ${dto.motivo_justificacion}`;
          await this.multaRepositorio.save(m);
        }
      } catch {
        // En caso de que no haya tabla o relación de multas
      }
    }

    // 5. Crear justificación institucional aprobada si crear_justificacion es true
    if (dto.crear_justificacion !== false && this.justificacionRepositorio) {
      try {
        let tipo_incidencia = TipoIncidencia.ASISTENCIA_PRACTICAS;
        if (registro.tipo === TipoAsistencia.ESCUELA_LIDERES) {
          tipo_incidencia = TipoIncidencia.ESCUELA_LIDERES;
        }

        const nueva_justificacion = this.justificacionRepositorio.create({
          becario_id: registro.becario_id,
          tipo_incidencia,
          referencia_id: registro.id,
          fecha_incidencia: registro.fecha instanceof Date ? registro.fecha : new Date(registro.fecha),
          motivo: 'Rectificación de Llegada y Justificación por Administración',
          descripcion: dto.motivo_justificacion,
          estado: EstadoJustificacion.APROBADA,
          observacion_supervisor: 'Retraso rectificado y justificado formalmente por la Administración',
          fecha_resolucion: new Date(),
          supervisor_id: usuario_id || null,
        });
        await this.justificacionRepositorio.save(nueva_justificacion);
      } catch {
        // Tolerancia si el repositorio de justificaciones no está en el contexto actual
      }
    }

    const guardado = await this.asistenciaRepositorio.save(registro);

    this.tiempoRealGateway?.notificarAsistencia({
      accion: 'rectificar',
      asistencia: guardado,
    });

    return guardado;
  }

  async revisarSupervisor(
    id: number,
    dto: RevisarSupervisorAsistenciaDto,
    supervisor_id: number,
  ): Promise<RegistroAsistencia> {
    const registro = await this.asistenciaRepositorio.findOne({
      where: { id },
      relations: { becario: true },
    });
    if (!registro) {
      throw new NotFoundException(`Registro de asistencia #${id} no encontrado`);
    }
    registro.revisado_por_supervisor_id = supervisor_id;
    registro.fecha_revision_supervisor = new Date();
    if (dto.observacion_supervisor) {
      registro.observacion_supervisor = dto.observacion_supervisor;
    }
    registro.estado_aprobacion =
      dto.estado || EstadoAprobacionAsistencia.REVISADO_SUPERVISOR;

    const guardado = await this.asistenciaRepositorio.save(registro);
    this.tiempoRealGateway?.notificarAsistencia({
      accion: 'revisar_supervisor',
      registro: guardado,
    });
    return guardado;
  }

  async aprobarAdministracion(
    id: number,
    dto: AprobarAdminAsistenciaDto,
    admin_id: number,
  ): Promise<RegistroAsistencia> {
    const registro = await this.asistenciaRepositorio.findOne({
      where: { id },
      relations: { becario: true },
    });
    if (!registro) {
      throw new NotFoundException(`Registro de asistencia #${id} no encontrado`);
    }
    registro.aprobado_por_admin_id = admin_id;
    registro.fecha_aprobacion_admin = new Date();
    if (dto.observacion_admin) {
      registro.observacion_admin = dto.observacion_admin;
    }
    registro.estado_aprobacion =
      dto.estado || EstadoAprobacionAsistencia.APROBADO_ADMINISTRACION;

    const guardado = await this.asistenciaRepositorio.save(registro);
    this.tiempoRealGateway?.notificarAsistencia({
      accion: 'aprobar_administracion',
      registro: guardado,
    });
    return guardado;
  }
}

