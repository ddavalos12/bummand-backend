import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento, EstadoEvento } from './entidades/evento.entidad';
import { AsistenciaEvento, EstadoAsistenciaEvento } from './entidades/asistencia-evento.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { CrearEventoDto } from './dtos/crear-evento.dto';
import { ActualizarEventoDto } from './dtos/actualizar-evento.dto';
import { MarcarAsistenciaEventoDto } from './dtos/marcar-asistencia-evento.dto';
import { calcularDistanciaMetros } from '../../utilidades/geo.utilidad';
import { Optional } from '@nestjs/common';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';

@Injectable()
export class EventosServicio {
  constructor(
    @InjectRepository(Evento)
    private readonly evento_repo: Repository<Evento>,
    @InjectRepository(AsistenciaEvento)
    private readonly asistencia_repo: Repository<AsistenciaEvento>,
    @InjectRepository(Becario)
    private readonly becario_repo: Repository<Becario>,
    @Optional()
    private readonly tiempoRealGateway?: TiempoRealGateway,
  ) {}

  async crear(dto: CrearEventoDto, creador_id?: number): Promise<Evento> {
    const nuevo_evento = this.evento_repo.create({
      ...dto,
      creador_id: creador_id || undefined,
      radio_tolerancia_m: dto.radio_tolerancia_m || 100,
      estado: dto.estado || EstadoEvento.PROGRAMADO,
    });
    const guardado = await this.evento_repo.save(nuevo_evento);
    this.tiempoRealGateway?.notificarEvento({ accion: 'crear', evento: guardado });
    return guardado;
  }

  async actualizar(id: number, dto: ActualizarEventoDto): Promise<Evento> {
    const evento = await this.obtenerPorId(id);
    Object.assign(evento, dto);
    const guardado = await this.evento_repo.save(evento);
    this.tiempoRealGateway?.notificarEvento({ accion: 'actualizar', evento: guardado });
    return guardado;
  }

  async obtenerTodos(): Promise<Evento[]> {
    return this.evento_repo.find({
      order: { fecha: 'ASC', hora_inicio: 'ASC' },
      relations: { creador: true },
    });
  }

  async obtenerPorId(id: number): Promise<Evento> {
    const evento = await this.evento_repo.findOne({
      where: { id },
      relations: { creador: true, asistencias: { becario: { usuario: true } } },
    });
    if (!evento) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }
    return evento;
  }

  async marcarAsistencia(
    evento_id: number,
    dto: MarcarAsistenciaEventoDto,
    usuario_id?: number,
  ): Promise<AsistenciaEvento> {
    const evento = await this.evento_repo.findOne({ where: { id: evento_id } });
    if (!evento) {
      throw new NotFoundException(`Evento con ID ${evento_id} no encontrado`);
    }

    if (evento.estado === EstadoEvento.CANCELADO) {
      throw new BadRequestException('No se puede registrar asistencia en un evento cancelado');
    }

    // Identificar al becario por id explícito o por usuario_id del token
    let becario: Becario | null = null;
    if (dto.becario_id) {
      becario = await this.becario_repo.findOne({
        where: [{ id: dto.becario_id }, { usuario_id: dto.becario_id }],
      });
    } else if (usuario_id) {
      becario = await this.becario_repo.findOne({
        where: { usuario_id },
      });
    }

    if (!becario) {
      throw new NotFoundException('Perfil de becario no encontrado para registrar asistencia');
    }

    const marcacion_existente = await this.asistencia_repo.findOne({
      where: { evento_id: evento.id, becario_id: becario.id },
    });

    if (marcacion_existente) {
      throw new ConflictException('Ya existe una marcación de asistencia registrada para este evento');
    }

    // Geodesia Haversine
    const distancia_m = calcularDistanciaMetros(
      Number(dto.latitud),
      Number(dto.longitud),
      Number(evento.latitud),
      Number(evento.longitud),
    );

    const radio_tolerancia = evento.radio_tolerancia_m || 100;
    const dentro_de_radio = distancia_m <= radio_tolerancia;

    const ahora = new Date();
    const hora_marcacion = ahora.toTimeString().split(' ')[0];

    const estado: EstadoAsistenciaEvento = dentro_de_radio
      ? EstadoAsistenciaEvento.PRESENTE
      : EstadoAsistenciaEvento.FUERA_DE_RADIO;

    const observacion_automatica = dentro_de_radio
      ? dto.observaciones || 'Marcación puntual dentro de geocerca'
      : dto.observaciones
        ? `${dto.observaciones} (Marcación fuera de radio: ${Math.round(distancia_m)}m)`
        : `Marcación fuera del radio perimetral autorizado (${Math.round(distancia_m)}m de distancia)`;

    const nueva_asistencia = this.asistencia_repo.create({
      evento_id: evento.id,
      becario_id: becario.id,
      hora_marcacion,
      latitud: dto.latitud,
      longitud: dto.longitud,
      distancia_m: parseFloat(distancia_m.toFixed(2)),
      dentro_de_radio,
      estado,
      observaciones: observacion_automatica,
    });

    const guardada = await this.asistencia_repo.save(nueva_asistencia);
    this.tiempoRealGateway?.notificarEvento({ accion: 'asistencia_marcada', asistencia: guardada });
    return guardada;
  }

  async obtenerAsistenciasEvento(evento_id: number): Promise<AsistenciaEvento[]> {
    await this.obtenerPorId(evento_id);
    return this.asistencia_repo.find({
      where: { evento_id },
      relations: { becario: { usuario: true } },
      order: { hora_marcacion: 'ASC' },
    });
  }
}
