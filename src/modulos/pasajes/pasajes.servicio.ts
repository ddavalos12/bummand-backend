import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudPasajes, EstadoSolicitud } from './entidades/solicitud-pasaje.entidad';
import { Recorrido } from './entidades/recorrido.entidad';
import { TarifaTransporte } from './entidades/tarifa-transporte.entidad';
import { ParadaTransporte, PARADAS_OFICIALES_DEFECTO } from './entidades/parada-transporte.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { CrearSolicitudPasajeDto } from './dtos/crear-solicitud-pasaje.dto';
import { AgregarRecorridoDto } from './dtos/agregar-recorrido.dto';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';

import { CrearTarifaDto } from './dtos/crear-tarifa.dto';
import { ActualizarTarifaDto } from './dtos/actualizar-tarifa.dto';

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
    @Optional()
    @InjectRepository(TarifaTransporte)
    private readonly tarifaRepositorio?: Repository<TarifaTransporte>,
    @Optional()
    @InjectRepository(ParadaTransporte)
    private readonly paradaRepositorio?: Repository<ParadaTransporte>,
    @Optional()
    @InjectRepository(Becario)
    private readonly becarioRepositorio?: Repository<Becario>,
    @Optional()
    private readonly tiempoRealGateway?: TiempoRealGateway,
  ) {}

  async resolverBecarioId(id_usuario_o_becario?: number): Promise<number> {
    if (!id_usuario_o_becario) return 0;
    if (!this.becarioRepositorio) return id_usuario_o_becario;
    const becario = await this.becarioRepositorio.findOne({
      where: [{ id: id_usuario_o_becario }, { usuario_id: id_usuario_o_becario }],
    });
    return becario ? becario.id : id_usuario_o_becario;
  }

  async obtenerTarifasOficiales(fecha_referencia?: string | Date): Promise<TarifaTransporte[]> {
    const fecha = fecha_referencia ? new Date(fecha_referencia) : new Date();
    const fecha_str = !isNaN(fecha.getTime()) ? fecha.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    if (this.tarifaRepositorio) {
      const encontradas = await this.tarifaRepositorio
        .createQueryBuilder('tarifa')
        .where('tarifa.activo = :activo', { activo: true })
        .andWhere('tarifa.vigente_desde <= :fecha', { fecha: fecha_str })
        .andWhere('(tarifa.vigente_hasta IS NULL OR tarifa.vigente_hasta >= :fecha)', { fecha: fecha_str })
        .orderBy('tarifa.costo_bs', 'ASC')
        .getMany();

      if (encontradas && encontradas.length > 0) {
        return encontradas;
      }
    }

    const catalogo_base: Partial<TarifaTransporte>[] = [
      { id: 1, medio_transporte: 'Micro / Colectivo Urbano', descripcion: 'Ruta regular La Paz / El Alto', costo_bs: 2.00, tramo_tipo: 'urbano', activo: true, vigente_desde: '2026-01-01', vigente_hasta: null, created_at: new Date() },
      { id: 2, medio_transporte: 'Minibús Tramo Corto', descripcion: 'Parada intermedia o tramo corto', costo_bs: 2.00, tramo_tipo: 'urbano', activo: true, vigente_desde: '2026-01-01', vigente_hasta: null, created_at: new Date() },
      { id: 3, medio_transporte: 'Minibús Tramo Directo', descripcion: 'Ruta directa troncal urbana', costo_bs: 2.60, tramo_tipo: 'urbano', activo: true, vigente_desde: '2026-01-01', vigente_hasta: null, created_at: new Date() },
      { id: 4, medio_transporte: 'Mi Teleférico', descripcion: 'Línea de red por tramo', costo_bs: 3.00, tramo_tipo: 'interciudad', activo: true, vigente_desde: '2026-01-01', vigente_hasta: null, created_at: new Date() },
      { id: 5, medio_transporte: 'Minibús Interciudad / El Alto', descripcion: 'Tramo La Paz - El Alto o extralargo', costo_bs: 3.50, tramo_tipo: 'interciudad', activo: true, vigente_desde: '2026-01-01', vigente_hasta: null, created_at: new Date() },
      { id: 6, medio_transporte: 'Trufi Troncal', descripcion: 'Ruta fija troncal', costo_bs: 4.00, tramo_tipo: 'urbano', activo: true, vigente_desde: '2026-01-01', vigente_hasta: null, created_at: new Date() },
    ];

    return catalogo_base.filter((t) => {
      const desde = String(t.vigente_desde);
      const hasta = t.vigente_hasta ? String(t.vigente_hasta) : null;
      return desde <= fecha_str && (!hasta || hasta >= fecha_str);
    }) as TarifaTransporte[];
  }

  async listarTodasLasTarifas(): Promise<TarifaTransporte[]> {
    if (this.tarifaRepositorio) {
      const todas = await this.tarifaRepositorio.find({
        order: { vigente_desde: 'DESC', medio_transporte: 'ASC' },
      });
      if (todas && todas.length > 0) {
        return todas;
      }
    }
    return this.obtenerTarifasOficiales();
  }

  async crearTarifa(dto: CrearTarifaDto): Promise<TarifaTransporte> {
    if (!this.tarifaRepositorio) {
      throw new BadRequestException('El repositorio de tarifas no está disponible.');
    }

    const fecha_nueva = new Date(dto.vigente_desde);
    const fecha_cierre = new Date(fecha_nueva);
    fecha_cierre.setDate(fecha_cierre.getDate() - 1);
    const fecha_cierre_str = !isNaN(fecha_cierre.getTime())
      ? fecha_cierre.toISOString().split('T')[0]
      : dto.vigente_desde;

    const tarifa_anterior = await this.tarifaRepositorio.findOne({
      where: {
        medio_transporte: dto.medio_transporte,
        activo: true,
      },
      order: { vigente_desde: 'DESC' },
    });

    if (tarifa_anterior && !tarifa_anterior.vigente_hasta) {
      tarifa_anterior.vigente_hasta = fecha_cierre_str;
      await this.tarifaRepositorio.save(tarifa_anterior);
    }

    const nueva_tarifa = this.tarifaRepositorio.create({
      ...dto,
      activo: dto.activo ?? true,
      tramo_tipo: dto.tramo_tipo ?? 'urbano',
    });

    const guardada = await this.tarifaRepositorio.save(nueva_tarifa);
    this.tiempoRealGateway?.notificarPasajes({ accion: 'tarifa_creada', tarifa: guardada });
    return guardada;
  }

  async actualizarTarifa(id: number, dto: ActualizarTarifaDto): Promise<TarifaTransporte> {
    if (!this.tarifaRepositorio) {
      throw new BadRequestException('El repositorio de tarifas no está disponible.');
    }
    const tarifa = await this.tarifaRepositorio.findOne({ where: { id } });
    if (!tarifa) {
      throw new NotFoundException(`Tarifa con ID ${id} no encontrada.`);
    }
    Object.assign(tarifa, dto);
    const guardada = await this.tarifaRepositorio.save(tarifa);
    this.tiempoRealGateway?.notificarPasajes({ accion: 'tarifa_actualizada', tarifa: guardada });
    return guardada;
  }

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
    const becario_id_real = await this.resolverBecarioId(dto.becario_id);
    const nueva_solicitud = this.solicitudRepositorio.create({
      ...dto,
      becario_id: becario_id_real,
      estado: EstadoSolicitud.BORRADOR,
      monto_total: 0,
      monto_devolucion: 0,
    });
    const guardada = await this.solicitudRepositorio.save(nueva_solicitud);
    this.tiempoRealGateway?.notificarPasajes({ accion: 'crear', solicitud: guardada });
    return guardada;
  }

  async agregarRecorrido(dto: AgregarRecorridoDto): Promise<Recorrido> {
    const becario_id_real = await this.resolverBecarioId(dto.becario_id || 0);

    let solicitud = await this.solicitudRepositorio.findOne({
      where: [
        { becario_id: becario_id_real, estado: EstadoSolicitud.BORRADOR },
        ...(dto.becario_id ? [{ becario: { usuario_id: dto.becario_id }, estado: EstadoSolicitud.BORRADOR }] : []),
      ],
      order: { created_at: 'DESC' },
    });

    if (!solicitud) {
      solicitud = this.solicitudRepositorio.create({
        becario_id: becario_id_real,
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
      tarifa: Number(dto.tarifa),
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

    this.tiempoRealGateway?.notificarPasajes({ accion: 'recorrido_agregado', recorrido: nuevo_recorrido, solicitud });

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

    if (usuario_id) {
      const becario_id_real = await this.resolverBecarioId(usuario_id);
      if (solicitud.becario_id !== becario_id_real && solicitud.becario_id !== usuario_id) {
        throw new BadRequestException('No tiene autorización para enviar una solicitud ajena.');
      }
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
    const guardada = await this.solicitudRepositorio.save(solicitud);
    this.tiempoRealGateway?.notificarPasajes({ accion: 'enviar', solicitud: guardada });
    return guardada;
  }

  async eliminarRecorrido(id: number, usuario_id?: number): Promise<{ mensaje: string }> {
    const recorrido = await this.recorridoRepositorio.findOne({ where: { id } });
    if (!recorrido) {
      throw new NotFoundException(`Recorrido con ID ${id} no encontrado.`);
    }

    const solicitud = await this.solicitudRepositorio.findOne({
      where: { id: recorrido.solicitud_id },
      relations: { recorridos: true },
    });
    if (!solicitud) {
      throw new NotFoundException('Solicitud asociada no encontrada.');
    }

    if (usuario_id) {
      const becario_id_real = await this.resolverBecarioId(usuario_id);
      if (solicitud.becario_id !== becario_id_real && solicitud.becario_id !== usuario_id) {
        throw new BadRequestException('No tiene autorización para eliminar recorridos de esta solicitud.');
      }
    }

    if (solicitud.estado !== EstadoSolicitud.BORRADOR && solicitud.estado !== EstadoSolicitud.RECHAZADO) {
      throw new BadRequestException(`No se puede eliminar un recorrido de una solicitud en estado '${solicitud.estado}'.`);
    }

    await this.recorridoRepositorio.remove(recorrido);

    const recorridos_actuales = await this.recorridoRepositorio.find({ where: { solicitud_id: solicitud.id } });
    const calculo = this.calcularReembolsoCentavos(recorridos_actuales.map((r) => Number(r.tarifa)));
    solicitud.monto_total = calculo.monto_total;
    solicitud.monto_devolucion = calculo.monto_devolucion;
    await this.solicitudRepositorio.save(solicitud);

    this.tiempoRealGateway?.notificarPasajes({ accion: 'recorrido_eliminado', recorrido_id: id, solicitud });
    return { mensaje: 'Recorrido eliminado exitosamente.' };
  }

  async confirmarDatos(usuario_id: number, periodo?: string): Promise<{ mensaje: string; periodo?: string; confirmado_en: Date }> {
    const ahora = new Date();
    const becario_id_real = await this.resolverBecarioId(usuario_id);

    if (periodo) {
      const solicitud = await this.solicitudRepositorio.findOne({
        where: [
          { becario_id: becario_id_real, periodo },
          { becario: { usuario_id }, periodo },
        ],
      });
      if (solicitud) {
        solicitud.datos_becario = {
          ...(solicitud.datos_becario || {}),
          datos_confirmados_en: ahora,
        };
        await this.solicitudRepositorio.save(solicitud);
      }
    }

    return {
      mensaje: 'Datos confirmados exitosamente.',
      periodo,
      confirmado_en: ahora,
    };
  }

  async obtenerTodas(): Promise<SolicitudPasajes[]> {
    const solicitudes = await this.solicitudRepositorio.find({
      relations: { recorridos: true, becario: { usuario: true } },
      order: { id: 'DESC' },
    });
    return solicitudes.map((s) => ({
      ...s,
      monto_total: Number(s.monto_total) || 0,
      monto_devolucion: Number(s.monto_devolucion) || 0,
      recorridos: (s.recorridos || []).map((r) => ({
        ...r,
        tarifa: Number(r.tarifa) || 0,
      })),
    })) as SolicitudPasajes[];
  }

  async obtenerPorId(id: number): Promise<SolicitudPasajes> {
    const solicitud = await this.solicitudRepositorio.findOne({
      where: { id },
      relations: { recorridos: true, becario: { usuario: true } },
    });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud de pasaje con ID ${id} no encontrada.`);
    }
    return {
      ...solicitud,
      monto_total: Number(solicitud.monto_total) || 0,
      monto_devolucion: Number(solicitud.monto_devolucion) || 0,
      recorridos: (solicitud.recorridos || []).map((r) => ({
        ...r,
        tarifa: Number(r.tarifa) || 0,
      })),
    } as SolicitudPasajes;
  }

  async obtenerPorBecario(id_referencia: number): Promise<SolicitudPasajes[]> {
    const becario_id_real = await this.resolverBecarioId(id_referencia);
    const solicitudes = await this.solicitudRepositorio.find({
      where: [
        { becario_id: becario_id_real },
        { becario: { usuario_id: id_referencia } },
      ],
      relations: { recorridos: true },
      order: { created_at: 'DESC' },
    });

    return solicitudes.map((s) => ({
      ...s,
      monto_total: Number(s.monto_total) || 0,
      monto_devolucion: Number(s.monto_devolucion) || 0,
      recorridos: (s.recorridos || []).map((r) => ({
        ...r,
        tarifa: Number(r.tarifa) || 0,
      })),
    })) as SolicitudPasajes[];
  }

  async aprobarSolicitud(id: number, supervisor_id: number): Promise<SolicitudPasajes> {
    const solicitud = await this.obtenerPorId(id);
    solicitud.estado = EstadoSolicitud.APROBADO;
    solicitud.supervisor_id = supervisor_id;
    solicitud.fecha_resolucion = new Date();
    const guardada = await this.solicitudRepositorio.save(solicitud);
    this.tiempoRealGateway?.notificarPasajes({ accion: 'aprobar', solicitud: guardada });
    return guardada;
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
    const guardada = await this.solicitudRepositorio.save(solicitud);
    this.tiempoRealGateway?.notificarPasajes({ accion: 'rechazar', solicitud: guardada });
    return guardada;
  }

  async obtenerParadas(ciudad?: string): Promise<ParadaTransporte[]> {
    if (this.paradaRepositorio) {
      const where: any = {};
      if (ciudad) {
        where.ciudad = ciudad;
      }
      const paradas_db = await this.paradaRepositorio.find({
        where,
        order: { ciudad: 'ASC', nombre: 'ASC' },
      });
      if (paradas_db && paradas_db.length > 0) {
        return paradas_db;
      }
    }

    // Fallback a catálogo en memoria si la BD aún no ha sido sembrada
    if (ciudad) {
      return (PARADAS_OFICIALES_DEFECTO as ParadaTransporte[]).filter(
        (p) => p.ciudad?.toLowerCase() === ciudad.toLowerCase(),
      );
    }
    return PARADAS_OFICIALES_DEFECTO as ParadaTransporte[];
  }

  async sembrarParadas(): Promise<ParadaTransporte[]> {
    if (!this.paradaRepositorio) {
      return PARADAS_OFICIALES_DEFECTO as ParadaTransporte[];
    }

    const sembradas: ParadaTransporte[] = [];
    for (const p of PARADAS_OFICIALES_DEFECTO) {
      let existente = await this.paradaRepositorio.findOne({ where: { nombre: p.nombre } });
      if (!existente) {
        existente = this.paradaRepositorio.create(p);
        existente = await this.paradaRepositorio.save(existente);
      }
      sembradas.push(existente);
    }
    return sembradas;
  }
}
