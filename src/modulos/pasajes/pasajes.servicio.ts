import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudPasajes, EstadoSolicitud } from './entidades/solicitud-pasaje.entidad';
import { Recorrido } from './entidades/recorrido.entidad';
import { CrearSolicitudPasajeDto } from './dtos/crear-solicitud-pasaje.dto';
import { AgregarRecorridoDto } from './dtos/agregar-recorrido.dto';

@Injectable()
export class PasajesServicio {
  constructor(
    @InjectRepository(SolicitudPasajes)
    private readonly solicitudRepositorio: Repository<SolicitudPasajes>,
    @InjectRepository(Recorrido)
    private readonly recorridoRepositorio: Repository<Recorrido>,
  ) {}

  async crear(dto: CrearSolicitudPasajeDto): Promise<SolicitudPasajes> {
    const nuevaSolicitud = this.solicitudRepositorio.create(dto);
    return this.solicitudRepositorio.save(nuevaSolicitud);
  }

  async agregarRecorrido(dto: AgregarRecorridoDto): Promise<Recorrido> {
    // 1. Obtener o crear solicitud mensual. (Aquí lo simplificamos a buscar la última)
    let solicitud = await this.solicitudRepositorio.findOne({
      where: { becario_id: dto.becario_id, estado: EstadoSolicitud.BORRADOR },
      order: { createdAt: 'DESC' }
    });

    if (!solicitud) {
      // Creamos una solicitud borrador automática si no existe para ese periodo.
      // Se asume que el periodo lo deducimos de la fecha (mock).
      solicitud = this.solicitudRepositorio.create({
        becario_id: dto.becario_id,
        periodo: new Date(dto.fecha).toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
      });
      solicitud = await this.solicitudRepositorio.save(solicitud);
    }

    // 2. Crear recorrido
    const nuevoRecorrido = this.recorridoRepositorio.create({
      solicitudId: solicitud.id,
      fecha: new Date(dto.fecha),
      tramo: dto.tramo,
      origen: dto.origen,
      destino: dto.destino,
      tarifa: dto.tarifa,
      apoyoRealizado: dto.apoyoRealizado,
      latOrigen: dto.latOrigen,
      lngOrigen: dto.lngOrigen,
      latDestino: dto.latDestino,
      lngDestino: dto.lngDestino,
    });

    await this.recorridoRepositorio.save(nuevoRecorrido);

    // 3. Recalcular montos
    const recorridos = await this.recorridoRepositorio.find({ where: { solicitudId: solicitud.id } });
    solicitud.montoTotal = recorridos.reduce((acc, r) => acc + Number(r.tarifa), 0);
    solicitud.montoDevolucion = solicitud.montoTotal * 0.8; // RF-06: 80%
    await this.solicitudRepositorio.save(solicitud);

    return nuevoRecorrido;
  }

  async obtenerTodas(): Promise<SolicitudPasajes[]> {
    return this.solicitudRepositorio.find({ relations: { recorridos: true } });
  }
}

