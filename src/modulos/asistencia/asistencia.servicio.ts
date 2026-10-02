import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroAsistencia, TipoAsistencia } from './entidades/registro-asistencia.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';
import { Becario } from '../becarios/entidades/becario.entidad';
import { calcularDistanciaMetros } from '../../utilidades/geo.utilidad';

const MARGEN_GPS_MAXIMO_M = 10;

@Injectable()
export class AsistenciaServicio {
  constructor(
    @InjectRepository(RegistroAsistencia)
    private readonly asistenciaRepositorio: Repository<RegistroAsistencia>,
    @InjectRepository(Becario)
    private readonly becarioRepositorio: Repository<Becario>,
  ) {}

  async registrarIngreso(dto: CoordenadasDto): Promise<{ registro: RegistroAsistencia; mensaje: string }> {
    const becario = await this.becarioRepositorio.findOne({
      where: { id: dto.becario_id },
      relations: { lugar_practica: true },
    });

    if (!becario) throw new NotFoundException('Becario no encontrado');
    if (!becario.lugar_practica) throw new ConflictException('Becario sin lugar de prácticas asignado');

    const tipo = dto.tipo || TipoAsistencia.PRACTICAS;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ingresoAbierto = await this.asistenciaRepositorio.findOne({
      where: { becario_id: becario.id, fecha: hoy, tipo, hora_salida: null as any },
    });

    if (ingresoAbierto) {
      throw new ConflictException('Ya existe un ingreso abierto hoy. Registra la salida primero.');
    }

    const distancia_m = calcularDistanciaMetros(dto.latitud, dto.longitud, Number(becario.lugar_practica.latitud), Number(becario.lugar_practica.longitud));
    const margen = Math.min(Math.max(dto.precision || 0, 0), MARGEN_GPS_MAXIMO_M);
    const dentro_de_radio = dto.simulada !== true && distancia_m <= becario.lugar_practica.radio_tolerancia_m + margen;

    const registro = this.asistenciaRepositorio.create({
      becario_id: becario.id,
      tipo,
      fecha: hoy,
      hora_ingreso: new Date().toTimeString().split(' ')[0], // HH:MM:SS
      lat_ingreso: dto.latitud,
      lng_ingreso: dto.longitud,
      dentro_de_radio,
      // dentro_de_horario: null // Faltaría verificar horario
    });

    await this.asistenciaRepositorio.save(registro);

    const mensaje = dentro_de_radio ? 'Ingreso registrado correctamente' : 'Ingreso registrado, pero fuera del radio';
    return { registro, mensaje };
  }

  async registrarSalida(dto: CoordenadasDto): Promise<{ registro: RegistroAsistencia; mensaje: string }> {
    const tipo = dto.tipo || TipoAsistencia.PRACTICAS;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registro_abierto = await this.asistenciaRepositorio.findOne({
      where: { becario_id: dto.becario_id, fecha: hoy, tipo, hora_salida: null as any },
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

    return { registro: registro_abierto, mensaje: 'Salida registrada correctamente' };
  }

  async obtenerTodos(): Promise<RegistroAsistencia[]> {
    return this.asistenciaRepositorio.find();
  }
}

