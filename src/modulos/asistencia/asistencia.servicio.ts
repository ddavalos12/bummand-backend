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
      where: { id: dto.becarioId },
      relations: { lugarPractica: true },
    });

    if (!becario) throw new NotFoundException('Becario no encontrado');
    if (!becario.lugarPractica) throw new ConflictException('Becario sin lugar de prácticas asignado');

    const tipo = dto.tipo || TipoAsistencia.PRACTICAS;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ingresoAbierto = await this.asistenciaRepositorio.findOne({
      where: { becarioId: becario.id, fecha: hoy, tipo, horaSalida: null as any },
    });

    if (ingresoAbierto) {
      throw new ConflictException('Ya existe un ingreso abierto hoy. Registra la salida primero.');
    }

    const distanciaM = calcularDistanciaMetros(dto.latitud, dto.longitud, Number(becario.lugarPractica.latitud), Number(becario.lugarPractica.longitud));
    const margen = Math.min(Math.max(dto.precision || 0, 0), MARGEN_GPS_MAXIMO_M);
    const dentroDeRadio = dto.simulada !== true && distanciaM <= becario.lugarPractica.radioToleranciaM + margen;

    const registro = this.asistenciaRepositorio.create({
      becarioId: becario.id,
      tipo,
      fecha: hoy,
      horaIngreso: new Date().toTimeString().split(' ')[0], // HH:MM:SS
      latIngreso: dto.latitud,
      lngIngreso: dto.longitud,
      dentroDeRadio,
      // dentroDeHorario: null // Faltaría verificar horario
    });

    await this.asistenciaRepositorio.save(registro);

    const mensaje = dentroDeRadio ? 'Ingreso registrado correctamente' : 'Ingreso registrado, pero fuera del radio';
    return { registro, mensaje };
  }

  async registrarSalida(dto: CoordenadasDto): Promise<{ registro: RegistroAsistencia; mensaje: string }> {
    const tipo = dto.tipo || TipoAsistencia.PRACTICAS;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const registroAbierto = await this.asistenciaRepositorio.findOne({
      where: { becarioId: dto.becarioId, fecha: hoy, tipo, horaSalida: null as any },
    });

    if (!registroAbierto) {
      throw new NotFoundException('No existe un ingreso abierto hoy.');
    }

    registroAbierto.horaSalida = new Date().toTimeString().split(' ')[0];
    registroAbierto.latSalida = dto.latitud;
    registroAbierto.lngSalida = dto.longitud;
    
    // Cálculo básico de horas (requiere mejor Parse en el futuro)
    const [hI, mI] = registroAbierto.horaIngreso.split(':').map(Number);
    const [hS, mS] = registroAbierto.horaSalida.split(':').map(Number);
    const horas = (hS + mS / 60) - (hI + mI / 60);
    registroAbierto.horasTrabajadas = parseFloat(horas.toFixed(2));

    await this.asistenciaRepositorio.save(registroAbierto);

    return { registro: registroAbierto, mensaje: 'Salida registrada correctamente' };
  }

  async obtenerTodos(): Promise<RegistroAsistencia[]> {
    return this.asistenciaRepositorio.find();
  }
}
