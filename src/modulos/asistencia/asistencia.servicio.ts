import { Injectable, NotFoundException, ConflictException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia, TipoAsistencia } from './entidades/registro-asistencia.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';
import { Becario } from '../becarios/entidades/becario.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
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
    private readonly tiempoRealGateway?: TiempoRealGateway,
  ) {}

  private verificarHorario(tipo: TipoAsistencia, fecha_hora: Date = new Date()): { dentro: boolean; advertencia?: string } {
    const dia_semana = fecha_hora.getDay(); // 0 = Domingo, 5 = Viernes, 6 = Sábado
    const horas = fecha_hora.getHours();
    const minutos = fecha_hora.getMinutes();
    const tiempo_decimal = horas + minutos / 60;

    if (tipo === TipoAsistencia.ESCUELA_LIDERES) {
      // Viernes a las 14:30 (ventana permisible institucional de 14:00 a 16:30)
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
      // Turno institucional laboral de lunes a viernes o sábados (07:30 a 19:00)
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

    const evaluacion_horario = this.verificarHorario(tipo, ahora);

    const registro = this.asistenciaRepositorio.create({
      becario_id: becario.id,
      tipo,
      fecha: hoy,
      hora_ingreso: ahora.toTimeString().split(' ')[0], // HH:MM:SS
      lat_ingreso: dto.latitud,
      lng_ingreso: dto.longitud,
      dentro_de_radio,
      dentro_de_horario: evaluacion_horario.dentro,
    });

    await this.asistenciaRepositorio.save(registro);

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

  async obtenerTodos(): Promise<RegistroAsistencia[]> {
    return this.asistenciaRepositorio.find({
      relations: { becario: { usuario: true } },
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }
}

