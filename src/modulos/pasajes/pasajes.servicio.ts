import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudPasajes, EstadoSolicitud } from './entidades/solicitud-pasaje.entidad';
import { Recorrido } from './entidades/recorrido.entidad';
import { CrearSolicitudPasajeDto } from './dtos/crear-solicitud-pasaje.dto';
import { AgregarRecorridoDto } from './dtos/agregar-recorrido.dto';

export interface CalculoReembolsoPasajes {
  monto_total: number;
  monto_devolucion: number;
  total_centavos: number;
  devolucion_centavos: number;
}

@Injectable()
export class PasajesServicio {
  constructor(
    @InjectRepository(SolicitudPasajes)
    private readonly solicitudRepositorio: Repository<SolicitudPasajes>,
    @InjectRepository(Recorrido)
    private readonly recorridoRepositorio: Repository<Recorrido>,
  ) {}

  calcularReembolsoCentavos(tarifas: number[]): CalculoReembolsoPasajes {
    const total_centavos = tarifas.reduce((acumulado, tarifa) => {
      const tarifa_centavos = Math.round(Number(tarifa) * 100);
      return acumulado + tarifa_centavos;
    }, 0);

    const devolucion_centavos = Math.round((total_centavos * 80) / 100);

    return {
      monto_total: total_centavos / 100,
      monto_devolucion: devolucion_centavos / 100,
      total_centavos,
      devolucion_centavos,
    };
  }

  async crear(dto: CrearSolicitudPasajeDto): Promise<SolicitudPasajes> {
    const nueva_solicitud = this.solicitudRepositorio.create({
      ...dto,
      estado: EstadoSolicitud.BORRADOR,
      monto_total: 0,
      monto_devolucion: 0,
    });
    return this.solicitudRepositorio.save(nueva_solicitud);
  }

  async agregarRecorrido(dto: AgregarRecorridoDto): Promise<Recorrido> {
    let solicitud = await this.solicitudRepositorio.findOne({
      where: { becario_id: dto.becario_id, estado: EstadoSolicitud.BORRADOR },
      order: { created_at: 'DESC' },
    });

    if (!solicitud) {
      solicitud = this.solicitudRepositorio.create({
        becario_id: dto.becario_id,
        periodo: new Date(dto.fecha).toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
        estado: EstadoSolicitud.BORRADOR,
        monto_total: 0,
        monto_devolucion: 0,
      });
      solicitud = await this.solicitudRepositorio.save(solicitud);
    }

    const nuevo_recorrido = this.recorridoRepositorio.create({
      solicitud_id: solicitud.id,
      fecha: new Date(dto.fecha),
      tramo: dto.tramo,
      origen: dto.origen,
      destino: dto.destino,
      tarifa: dto.tarifa,
      apoyo_realizado: dto.apoyo_realizado || dto.apoyoRealizado,
      lat_origen: dto.lat_origen ?? dto.latOrigen,
      lng_origen: dto.lng_origen ?? dto.lngOrigen,
      lat_destino: dto.lat_destino ?? dto.latDestino,
      lng_destino: dto.lng_destino ?? dto.lngDestino,
    });

    await this.recorridoRepositorio.save(nuevo_recorrido);

    const recorridos = await this.recorridoRepositorio.find({ where: { solicitud_id: solicitud.id } });
    const calculo = this.calcularReembolsoCentavos(recorridos.map((r) => Number(r.tarifa)));

    solicitud.monto_total = calculo.monto_total;
    solicitud.monto_devolucion = calculo.monto_devolucion;
    await this.solicitudRepositorio.save(solicitud);

    return nuevo_recorrido;
  }

  async enviarSolicitud(id: number, usuario_id?: number, fecha_referencia: Date = new Date()): Promise<SolicitudPasajes> {
    const solicitud = await this.solicitudRepositorio.findOne({
      where: { id },
      relations: { recorridos: true },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud de pasaje con ID ${id} no encontrada.`);
    }

    if (usuario_id && solicitud.becario_id !== usuario_id) {
      throw new BadRequestException('No tiene autorización para enviar una solicitud ajena.');
    }

    if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
      throw new BadRequestException(`Solo se pueden enviar solicitudes en estado borrador. El estado actual es '${solicitud.estado}'.`);
    }

    if (!solicitud.recorridos || solicitud.recorridos.length === 0) {
      throw new BadRequestException('No se puede enviar una solicitud de pasajes sin recorridos registrados.');
    }

    const dia_del_mes = fecha_referencia.getDate();
    if (dia_del_mes < 24) {
      throw new BadRequestException(
        `Regla institucional BUMAND: El envío formal de la solicitud de pasajes solo está permitido a partir del día 24 de cada mes. Día actual: ${dia_del_mes}.`,
      );
    }

    solicitud.estado = EstadoSolicitud.PENDIENTE;
    solicitud.fecha_envio = fecha_referencia;
    return this.solicitudRepositorio.save(solicitud);
  }

  async obtenerTodas(): Promise<SolicitudPasajes[]> {
    return this.solicitudRepositorio.find({
      relations: { recorridos: true, becario: { usuario: true } },
      order: { id: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<SolicitudPasajes> {
    const solicitud = await this.solicitudRepositorio.findOne({
      where: { id },
      relations: { recorridos: true, becario: { usuario: true } },
    });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud de pasaje con ID ${id} no encontrada.`);
    }
    return solicitud;
  }

  async obtenerPorBecario(becario_id: number): Promise<SolicitudPasajes[]> {
    return this.solicitudRepositorio.find({
      where: { becario_id },
      relations: { recorridos: true },
      order: { created_at: 'DESC' },
    });
  }

  async aprobarSolicitud(id: number, supervisor_id: number): Promise<SolicitudPasajes> {
    const solicitud = await this.obtenerPorId(id);
    solicitud.estado = EstadoSolicitud.APROBADO;
    solicitud.supervisor_id = supervisor_id;
    solicitud.fecha_resolucion = new Date();
    return this.solicitudRepositorio.save(solicitud);
  }

  async rechazarSolicitud(id: number, supervisor_id: number, observaciones: string): Promise<SolicitudPasajes> {
    if (!observaciones || observaciones.trim().length === 0) {
      throw new BadRequestException('Es obligatorio proporcionar el motivo de observación para rechazar la solicitud.');
    }
    const solicitud = await this.obtenerPorId(id);
    solicitud.estado = EstadoSolicitud.RECHAZADO;
    solicitud.supervisor_id = supervisor_id;
    solicitud.observaciones = observaciones;
    solicitud.fecha_resolucion = new Date();
    return this.solicitudRepositorio.save(solicitud);
  }
}
