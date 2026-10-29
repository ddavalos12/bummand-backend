import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Refrigerio, DetalleIngredienteRefrigerio } from './entidades/refrigerio.entidad';
import { CrearRefrigerioDto } from './dtos/crear-refrigerio.dto';
import { ActualizarRefrigerioDto } from './dtos/actualizar-refrigerio.dto';
import { SortearDuplaDto } from './dtos/sortear-dupla.dto';
import { RendirRefrigerioDto } from './dtos/rendir-refrigerio.dto';
import { RevisarSupervisorDto } from './dtos/revisar-supervisor.dto';
import { AprobarAdministracionDto } from './dtos/aprobar-administracion.dto';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { NotificacionesServicio } from '../notificaciones/notificaciones.servicio';

export interface PlanillaReposicionRefrigerio {
  codigo_formulario: string;
  refrigerio_id: number;
  fecha: string;
  concepto: string;
  cantidad_raciones: number;
  costo_unitario_bs: number;
  costo_total_bs: number;
  presupuesto_referencial_bs: number;
  porcentaje_devolucion: number;
  monto_devolucion_bs: number;
  modalidad_preparacion: string;
  dupla_encargados: {
    encargado_1: {
      id: number | null;
      nombre: string | null;
    };
    encargado_2: {
      id: number | null;
      nombre: string | null;
    };
  };
  receptor_devolucion: {
    id: number | null;
    nombre: string | null;
    fecha_entrega: Date | null;
    entregado_por_usuario_id: number | null;
  };
  detalle_ingredientes: DetalleIngredienteRefrigerio[];
  responsable: {
    id: number;
    nombre: string;
    correo: string;
  };
  contexto_operativo: {
    evento?: string | null;
    lugar_practica?: string | null;
  };
  trazabilidad_supervisor?: {
    revisado_por_id: number | null;
    fecha_revision: Date | null;
    observacion: string | null;
  };
  firmas_conformidad: Record<string, unknown>[];
  total_firmas: number;
  registros_conformidad?: Record<string, unknown>[];
  total_registros_conformidad?: number;
  estado_reposicion: string;
  moneda: 'BOB (Bolivianos)';
  fecha_emision_planilla: string;
}

export interface RespuestaMiTurno {
  es_encargado: boolean;
  refrigerio_activo: Refrigerio | null;
  companero_dupla: {
    id: number;
    nombre: string;
  } | null;
  estado_reposicion: string | null;
  monto_devolucion_bs: number;
  porcentaje_devolucion: number;
  receptor_devolucion: {
    id: number | null;
    nombre: string | null;
    es_uno_mismo: boolean;
  } | null;
}

@Injectable()
export class RefrigeriosServicio {
  constructor(
    @InjectRepository(Refrigerio)
    private readonly refrigerio_repo: Repository<Refrigerio>,
    @Optional()
    @InjectRepository(Becario)
    private readonly becario_repo?: Repository<Becario>,
    @Optional()
    @InjectRepository(Usuario)
    private readonly usuario_repo?: Repository<Usuario>,
    @Optional()
    private readonly notificaciones_servicio?: NotificacionesServicio,
  ) {}

  async crear(dto: CrearRefrigerioDto): Promise<Refrigerio> {
    const raciones = Number(dto.cantidad_raciones || 23);
    let unitario = dto.costo_unitario_bs !== undefined ? Number(dto.costo_unitario_bs) : 0;
    let total = dto.costo_total_bs !== undefined ? Number(dto.costo_total_bs) : 0;

    if (total > 0 && raciones > 0 && (!unitario || unitario === 0)) {
      unitario = Number((total / raciones).toFixed(2));
    } else if (unitario > 0 && raciones > 0 && (!total || total === 0)) {
      total = Number((raciones * unitario).toFixed(2));
    } else if (total === 0 && unitario > 0) {
      total = Number((raciones * unitario).toFixed(2));
    }

    const presupuesto_ref = dto.presupuesto_referencial_bs !== undefined
      ? Number(dto.presupuesto_referencial_bs)
      : Number((raciones * 6.0).toFixed(2));

    const porcentaje_dev = dto.porcentaje_devolucion !== undefined
      ? Number(dto.porcentaje_devolucion)
      : 100.0;

    const monto_dev = dto.monto_devolucion_bs !== undefined
      ? Number(dto.monto_devolucion_bs)
      : total;

    const nuevo_refrigerio = this.refrigerio_repo.create({
      fecha: new Date(dto.fecha),
      evento_id: dto.evento_id || null,
      lugar_practica_id: dto.lugar_practica_id || null,
      descripcion: dto.descripcion,
      cantidad_raciones: raciones,
      costo_unitario_bs: unitario,
      costo_total_bs: total,
      presupuesto_referencial_bs: presupuesto_ref,
      porcentaje_devolucion: porcentaje_dev,
      monto_devolucion_bs: monto_dev,
      responsable_id: dto.responsable_id,
      becario_encargado_1_id: dto.becario_encargado_1_id || dto.becario_id || null,
      becario_encargado_1_nombre: dto.becario_encargado_1_nombre || dto.becario_nombre || null,
      becario_encargado_2_id: dto.becario_encargado_2_id || null,
      becario_encargado_2_nombre: dto.becario_encargado_2_nombre || null,
      becario_id: dto.becario_encargado_1_id || dto.becario_id || null,
      becario_nombre: dto.becario_encargado_1_nombre || dto.becario_nombre || null,
      modalidad_preparacion: dto.modalidad_preparacion || 'cocina_diaconia',
      detalle_ingredientes: dto.detalle_ingredientes || null,
      becario_receptor_devolucion_id: dto.becario_receptor_devolucion_id || null,
      becario_receptor_devolucion_nombre: dto.becario_receptor_devolucion_nombre || null,
      estado_reposicion: dto.estado_reposicion || (total > 0 ? 'rendido_pendiente' : 'sorteado_programado'),
      firmas_conformidad: dto.firmas_conformidad || null,
    });

    return this.refrigerio_repo.save(nuevo_refrigerio);
  }

  async listar(filtros?: { fecha_inicio?: string; fecha_fin?: string }): Promise<Refrigerio[]> {
    const where: Record<string, unknown> = {};

    if (filtros?.fecha_inicio && filtros?.fecha_fin) {
      where.fecha = Between(new Date(filtros.fecha_inicio), new Date(filtros.fecha_fin));
    } else if (filtros?.fecha_inicio) {
      where.fecha = MoreThanOrEqual(new Date(filtros.fecha_inicio));
    } else if (filtros?.fecha_fin) {
      where.fecha = LessThanOrEqual(new Date(filtros.fecha_fin));
    }

    return this.refrigerio_repo.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: {
        responsable: true,
        evento: true,
        lugar_practica: true,
      },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Refrigerio> {
    const refrigerio = await this.refrigerio_repo.findOne({
      where: { id },
      relations: {
        responsable: true,
        evento: true,
        lugar_practica: true,
      },
    });

    if (!refrigerio) {
      throw new NotFoundException(`Refrigerio con ID ${id} no encontrado`);
    }

    return refrigerio;
  }

  async actualizar(id: number, dto: ActualizarRefrigerioDto): Promise<Refrigerio> {
    const refrigerio = await this.obtenerPorId(id);

    if (dto.fecha) refrigerio.fecha = new Date(dto.fecha);
    if (dto.evento_id !== undefined) refrigerio.evento_id = dto.evento_id || null;
    if (dto.lugar_practica_id !== undefined) refrigerio.lugar_practica_id = dto.lugar_practica_id || null;
    if (dto.descripcion !== undefined) refrigerio.descripcion = dto.descripcion;
    if (dto.cantidad_raciones !== undefined) refrigerio.cantidad_raciones = Number(dto.cantidad_raciones);

    if (dto.costo_total_bs !== undefined && dto.costo_unitario_bs === undefined) {
      refrigerio.costo_total_bs = Number(dto.costo_total_bs);
      if (refrigerio.cantidad_raciones > 0) {
        refrigerio.costo_unitario_bs = Number((refrigerio.costo_total_bs / refrigerio.cantidad_raciones).toFixed(2));
      }
      refrigerio.monto_devolucion_bs = refrigerio.costo_total_bs;
    } else if (dto.costo_unitario_bs !== undefined && dto.costo_total_bs === undefined) {
      refrigerio.costo_unitario_bs = Number(dto.costo_unitario_bs);
      refrigerio.costo_total_bs = Number((refrigerio.cantidad_raciones * refrigerio.costo_unitario_bs).toFixed(2));
      refrigerio.monto_devolucion_bs = refrigerio.costo_total_bs;
    } else {
      if (dto.costo_unitario_bs !== undefined) refrigerio.costo_unitario_bs = Number(dto.costo_unitario_bs);
      if (dto.costo_total_bs !== undefined) {
        refrigerio.costo_total_bs = Number(dto.costo_total_bs);
        refrigerio.monto_devolucion_bs = refrigerio.costo_total_bs;
      } else if (dto.cantidad_raciones !== undefined && refrigerio.costo_unitario_bs > 0) {
        refrigerio.costo_total_bs = Number((refrigerio.cantidad_raciones * refrigerio.costo_unitario_bs).toFixed(2));
        refrigerio.monto_devolucion_bs = refrigerio.costo_total_bs;
      }
    }

    if (dto.responsable_id !== undefined) refrigerio.responsable_id = dto.responsable_id;
    if (dto.becario_encargado_1_id !== undefined) {
      refrigerio.becario_encargado_1_id = dto.becario_encargado_1_id || null;
      refrigerio.becario_id = dto.becario_encargado_1_id || null;
    }
    if (dto.becario_encargado_1_nombre !== undefined) {
      refrigerio.becario_encargado_1_nombre = dto.becario_encargado_1_nombre || null;
      refrigerio.becario_nombre = dto.becario_encargado_1_nombre || null;
    }
    if (dto.becario_encargado_2_id !== undefined) refrigerio.becario_encargado_2_id = dto.becario_encargado_2_id || null;
    if (dto.becario_encargado_2_nombre !== undefined) refrigerio.becario_encargado_2_nombre = dto.becario_encargado_2_nombre || null;

    if (dto.becario_id !== undefined && dto.becario_encargado_1_id === undefined) {
      refrigerio.becario_id = dto.becario_id || null;
      refrigerio.becario_encargado_1_id = dto.becario_id || null;
    }
    if (dto.becario_nombre !== undefined && dto.becario_encargado_1_nombre === undefined) {
      refrigerio.becario_nombre = dto.becario_nombre || null;
      refrigerio.becario_encargado_1_nombre = dto.becario_nombre || null;
    }

    if (dto.modalidad_preparacion !== undefined) refrigerio.modalidad_preparacion = dto.modalidad_preparacion;
    if (dto.detalle_ingredientes !== undefined) refrigerio.detalle_ingredientes = dto.detalle_ingredientes || null;
    if (dto.presupuesto_referencial_bs !== undefined) refrigerio.presupuesto_referencial_bs = Number(dto.presupuesto_referencial_bs);
    if (dto.porcentaje_devolucion !== undefined) refrigerio.porcentaje_devolucion = Number(dto.porcentaje_devolucion);
    if (dto.monto_devolucion_bs !== undefined) refrigerio.monto_devolucion_bs = Number(dto.monto_devolucion_bs);
    if (dto.becario_receptor_devolucion_id !== undefined) refrigerio.becario_receptor_devolucion_id = dto.becario_receptor_devolucion_id || null;
    if (dto.becario_receptor_devolucion_nombre !== undefined) refrigerio.becario_receptor_devolucion_nombre = dto.becario_receptor_devolucion_nombre || null;
    if (dto.estado_reposicion !== undefined) refrigerio.estado_reposicion = dto.estado_reposicion;
    if (dto.firmas_conformidad !== undefined) refrigerio.firmas_conformidad = dto.firmas_conformidad || null;

    return this.refrigerio_repo.save(refrigerio);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const refrigerio = await this.obtenerPorId(id);
    await this.refrigerio_repo.remove(refrigerio);
    return { mensaje: `Refrigerio con ID ${id} eliminado satisfactoriamente` };
  }

  async sortearDupla(dto: SortearDuplaDto, responsable_id?: number): Promise<Refrigerio> {
    let becario_1: { id: number; nombre: string; usuario_id?: number | null } | null = null;
    let becario_2: { id: number; nombre: string; usuario_id?: number | null } | null = null;

    if (dto.becario_encargado_1_id && dto.becario_encargado_2_id) {
      if (dto.becario_encargado_1_id === dto.becario_encargado_2_id) {
        throw new BadRequestException('Los dos integrantes de la dupla deben ser becarios diferentes.');
      }

      if (this.becario_repo) {
        const b1 = await this.becario_repo.findOne({
          where: { id: dto.becario_encargado_1_id },
          relations: { usuario: true },
        });
        const b2 = await this.becario_repo.findOne({
          where: { id: dto.becario_encargado_2_id },
          relations: { usuario: true },
        });

        if (b1) {
          becario_1 = {
            id: b1.id,
            nombre: b1.nombre || b1.usuario?.nombre || `Becario #${b1.id}`,
            usuario_id: b1.usuario_id,
          };
        }
        if (b2) {
          becario_2 = {
            id: b2.id,
            nombre: b2.nombre || b2.usuario?.nombre || `Becario #${b2.id}`,
            usuario_id: b2.usuario_id,
          };
        }
      }

      if (!becario_1) {
        becario_1 = { id: dto.becario_encargado_1_id, nombre: `Becario #${dto.becario_encargado_1_id}` };
      }
      if (!becario_2) {
        becario_2 = { id: dto.becario_encargado_2_id, nombre: `Becario #${dto.becario_encargado_2_id}` };
      }
    } else {
      // Sorteo rotativo automático
      let todos_becarios: Array<{ id: number; nombre: string; usuario_id?: number | null }> = [];

      if (this.becario_repo) {
        const entidades = await this.becario_repo.find({
          relations: { usuario: true },
          order: { id: 'ASC' },
        });

        todos_becarios = entidades.map((b) => ({
          id: b.id,
          nombre: b.nombre || b.usuario?.nombre || `Becario #${b.id}`,
          usuario_id: b.usuario_id,
        }));
      }

      if (todos_becarios.length < 2) {
        // Fallback para pruebas o catálogo inicial
        todos_becarios = [
          { id: 1, nombre: 'Nilda Amalia Churata Paye', usuario_id: 101 },
          { id: 2, nombre: 'Joel Mamani Quispe', usuario_id: 102 },
          { id: 3, nombre: 'Carlos Oscar Luna Lizarraga', usuario_id: 103 },
          { id: 4, nombre: 'Adai Belen Huayta Cardozo', usuario_id: 104 },
        ];
      }

      // Obtener el historial de refrigerios previos para filtrar a los que ya participaron en la ronda actual
      const refrigerios_previos = await this.refrigerio_repo.find({
        order: { fecha: 'DESC', id: 'DESC' },
        take: 30,
      });

      const ids_ya_encargados = new Set<number>();
      for (const ref of refrigerios_previos) {
        if (ref.becario_encargado_1_id) ids_ya_encargados.add(ref.becario_encargado_1_id);
        if (ref.becario_encargado_2_id) ids_ya_encargados.add(ref.becario_encargado_2_id);
        if (ref.becario_id) ids_ya_encargados.add(ref.becario_id);
      }

      let candidatos = todos_becarios.filter((b) => !ids_ya_encargados.has(b.id));

      // Si quedan menos de 2 becarios en la ronda, reiniciar la ronda
      if (candidatos.length < 2) {
        candidatos = [...todos_becarios];
      }

      // Mezclar aleatoriamente los candidatos disponibles
      const mezclados = [...candidatos].sort(() => 0.5 - Math.random());
      becario_1 = mezclados[0];
      becario_2 = mezclados[1];
    }

    const raciones = Number(dto.cantidad_raciones || 23);
    const presupuesto_referencial = dto.presupuesto_referencial_bs !== undefined
      ? Number(dto.presupuesto_referencial_bs)
      : Number((raciones * 6.0).toFixed(2));

    const nuevo_refrigerio = this.refrigerio_repo.create({
      fecha: new Date(dto.fecha),
      evento_id: dto.evento_id || null,
      lugar_practica_id: dto.lugar_practica_id || null,
      descripcion: dto.descripcion || `Refrigerio Escuela de Líderes (${dto.fecha})`,
      cantidad_raciones: raciones,
      costo_unitario_bs: 6.0,
      costo_total_bs: 0.0,
      presupuesto_referencial_bs: presupuesto_referencial,
      porcentaje_devolucion: 100.0,
      monto_devolucion_bs: 0.0,
      modalidad_preparacion: 'cocina_diaconia',
      detalle_ingredientes: [],
      becario_encargado_1_id: becario_1.id,
      becario_encargado_1_nombre: becario_1.nombre,
      becario_encargado_2_id: becario_2.id,
      becario_encargado_2_nombre: becario_2.nombre,
      becario_id: becario_1.id,
      becario_nombre: becario_1.nombre,
      responsable_id: responsable_id || 1,
      estado_reposicion: 'sorteado_programado',
    });

    const guardado = await this.refrigerio_repo.save(nuevo_refrigerio);

    // Enviar notificaciones a ambos becarios de la dupla
    if (this.notificaciones_servicio) {
      if (becario_1.usuario_id) {
        await this.notificaciones_servicio.crear({
          usuario_id: becario_1.usuario_id,
          tipo: 'refrigerio_turno',
          mensaje: `¡Has sido seleccionado en la dupla para el refrigerio del viernes ${dto.fecha} junto a ${becario_2.nombre}! Presupuesto referencial institucional: Bs ${presupuesto_referencial.toFixed(2)}.`,
        }).catch(() => undefined);
      }
      if (becario_2.usuario_id) {
        await this.notificaciones_servicio.crear({
          usuario_id: becario_2.usuario_id,
          tipo: 'refrigerio_turno',
          mensaje: `¡Has sido seleccionado en la dupla para el refrigerio del viernes ${dto.fecha} junto a ${becario_1.nombre}! Presupuesto referencial institucional: Bs ${presupuesto_referencial.toFixed(2)}.`,
        }).catch(() => undefined);
      }
    }

    return guardado;
  }

  async obtenerMiTurno(usuario_id: number): Promise<RespuestaMiTurno> {
    let becario_id: number | null = null;

    if (this.becario_repo) {
      const becario = await this.becario_repo.findOne({
        where: { usuario_id },
      });
      if (becario) {
        becario_id = becario.id;
      }
    }

    if (!becario_id) {
      becario_id = usuario_id;
    }

    const refrigerio = await this.refrigerio_repo.findOne({
      where: [
        { becario_encargado_1_id: becario_id },
        { becario_encargado_2_id: becario_id },
        { becario_id: becario_id },
      ],
      order: { fecha: 'DESC', id: 'DESC' },
      relations: {
        evento: true,
        lugar_practica: true,
      },
    });

    if (!refrigerio) {
      return {
        es_encargado: false,
        refrigerio_activo: null,
        companero_dupla: null,
        estado_reposicion: null,
        monto_devolucion_bs: 0,
        porcentaje_devolucion: 100,
        receptor_devolucion: null,
      };
    }

    let companero: { id: number; nombre: string } | null = null;
    if (refrigerio.becario_encargado_1_id === becario_id && refrigerio.becario_encargado_2_id) {
      companero = {
        id: refrigerio.becario_encargado_2_id,
        nombre: refrigerio.becario_encargado_2_nombre || `Becario #${refrigerio.becario_encargado_2_id}`,
      };
    } else if (refrigerio.becario_encargado_2_id === becario_id && refrigerio.becario_encargado_1_id) {
      companero = {
        id: refrigerio.becario_encargado_1_id,
        nombre: refrigerio.becario_encargado_1_nombre || `Becario #${refrigerio.becario_encargado_1_id}`,
      };
    }

    const receptor = refrigerio.becario_receptor_devolucion_id
      ? {
          id: refrigerio.becario_receptor_devolucion_id,
          nombre: refrigerio.becario_receptor_devolucion_nombre,
          es_uno_mismo: refrigerio.becario_receptor_devolucion_id === becario_id,
        }
      : null;

    return {
      es_encargado: true,
      refrigerio_activo: refrigerio,
      companero_dupla: companero,
      estado_reposicion: refrigerio.estado_reposicion,
      monto_devolucion_bs: Number(refrigerio.monto_devolucion_bs || 0),
      porcentaje_devolucion: Number(refrigerio.porcentaje_devolucion || 100),
      receptor_devolucion: receptor,
    };
  }

  async rendirRefrigerio(
    id: number,
    dto: RendirRefrigerioDto,
  ): Promise<Refrigerio> {
    const refrigerio = await this.obtenerPorId(id);

    if (dto.descripcion) {
      refrigerio.descripcion = dto.descripcion;
    }
    refrigerio.modalidad_preparacion = dto.modalidad_preparacion;
    refrigerio.detalle_ingredientes = dto.detalle_ingredientes;
    refrigerio.costo_total_bs = Number(dto.costo_total_bs);

    if (dto.cantidad_raciones) {
      refrigerio.cantidad_raciones = Number(dto.cantidad_raciones);
    }

    if (refrigerio.cantidad_raciones > 0) {
      refrigerio.costo_unitario_bs = Number(
        (refrigerio.costo_total_bs / refrigerio.cantidad_raciones).toFixed(2),
      );
    }

    refrigerio.porcentaje_devolucion = 100.0;
    refrigerio.monto_devolucion_bs = refrigerio.costo_total_bs;
    refrigerio.estado_reposicion = 'rendido_pendiente';

    return this.refrigerio_repo.save(refrigerio);
  }

  async revisarSupervisor(
    id: number,
    dto: RevisarSupervisorDto,
    supervisor_id: number,
  ): Promise<Refrigerio> {
    const refrigerio = await this.obtenerPorId(id);

    refrigerio.estado_reposicion = 'revisado_supervisor';
    refrigerio.revisado_por_supervisor_id = supervisor_id;
    refrigerio.fecha_revision_supervisor = new Date();
    refrigerio.observacion_supervisor =
      dto.observacion || 'Rendición de insumos revisada y conforme por Supervisor';

    return this.refrigerio_repo.save(refrigerio);
  }

  async aprobarAdministracion(
    id: number,
    dto: AprobarAdministracionDto,
    administrador_id: number,
  ): Promise<Refrigerio> {
    const refrigerio = await this.obtenerPorId(id);

    if (!dto.becario_receptor_devolucion_id) {
      throw new BadRequestException(
        'Es obligatorio especificar el becario receptor único a quien se entrega el reembolso del 100%.',
      );
    }

    let nombre_receptor = dto.becario_receptor_devolucion_nombre;
    if (!nombre_receptor) {
      if (refrigerio.becario_encargado_1_id === dto.becario_receptor_devolucion_id) {
        nombre_receptor = refrigerio.becario_encargado_1_nombre || undefined;
      } else if (refrigerio.becario_encargado_2_id === dto.becario_receptor_devolucion_id) {
        nombre_receptor = refrigerio.becario_encargado_2_nombre || undefined;
      }
    }

    if (!nombre_receptor && this.becario_repo) {
      const b = await this.becario_repo.findOne({
        where: { id: dto.becario_receptor_devolucion_id },
        relations: { usuario: true },
      });
      if (b) {
        nombre_receptor = b.nombre || b.usuario?.nombre || `Becario #${b.id}`;
      }
    }

    refrigerio.porcentaje_devolucion = 100.0;
    refrigerio.monto_devolucion_bs = Number(refrigerio.costo_total_bs);
    refrigerio.becario_receptor_devolucion_id = dto.becario_receptor_devolucion_id;
    refrigerio.becario_receptor_devolucion_nombre = nombre_receptor || `Becario #${dto.becario_receptor_devolucion_id}`;
    refrigerio.estado_reposicion = 'aprobado_administracion';
    refrigerio.fecha_entrega_devolucion = new Date();
    refrigerio.entregado_por_usuario_id = administrador_id;

    const guardado = await this.refrigerio_repo.save(refrigerio);

    // Enviar notificación a ambos integrantes de la dupla
    if (this.notificaciones_servicio && this.becario_repo) {
      const ids_dupla = [
        refrigerio.becario_encargado_1_id,
        refrigerio.becario_encargado_2_id,
      ].filter((id): id is number => typeof id === 'number');

      for (const id_b of ids_dupla) {
        const b = await this.becario_repo.findOne({
          where: { id: id_b },
          relations: { usuario: true },
        });

        if (b?.usuario_id) {
          const fecha_formato = refrigerio.fecha.toString().split('T')[0];
          await this.notificaciones_servicio.crear({
            usuario_id: b.usuario_id,
            tipo: 'refrigerio_aprobado',
            mensaje: `El reembolso del 100% (Bs ${refrigerio.monto_devolucion_bs.toFixed(2)}) del refrigerio del ${fecha_formato} fue aprobado y entregado a ${refrigerio.becario_receptor_devolucion_nombre}. Coordinen la distribución interna según el gasto rendido.`,
          }).catch(() => undefined);
        }
      }
    }

    return guardado;
  }

  async generarPlanillaReposicion(id: number): Promise<PlanillaReposicionRefrigerio> {
    const refrigerio = await this.obtenerPorId(id);

    const firmas = Array.isArray(refrigerio.firmas_conformidad)
      ? refrigerio.firmas_conformidad
      : [];

    return {
      codigo_formulario: `REP-REF-${refrigerio.id.toString().padStart(5, '0')}`,
      refrigerio_id: refrigerio.id,
      fecha: refrigerio.fecha.toString().split('T')[0],
      concepto: refrigerio.descripcion,
      cantidad_raciones: Number(refrigerio.cantidad_raciones),
      costo_unitario_bs: Number(refrigerio.costo_unitario_bs),
      costo_total_bs: Number(refrigerio.costo_total_bs),
      presupuesto_referencial_bs: Number(refrigerio.presupuesto_referencial_bs || 138.0),
      porcentaje_devolucion: Number(refrigerio.porcentaje_devolucion || 100.0),
      monto_devolucion_bs: Number(refrigerio.monto_devolucion_bs || refrigerio.costo_total_bs),
      modalidad_preparacion: refrigerio.modalidad_preparacion || 'cocina_diaconia',
      dupla_encargados: {
        encargado_1: {
          id: refrigerio.becario_encargado_1_id || refrigerio.becario_id,
          nombre: refrigerio.becario_encargado_1_nombre || refrigerio.becario_nombre,
        },
        encargado_2: {
          id: refrigerio.becario_encargado_2_id,
          nombre: refrigerio.becario_encargado_2_nombre,
        },
      },
      receptor_devolucion: {
        id: refrigerio.becario_receptor_devolucion_id,
        nombre: refrigerio.becario_receptor_devolucion_nombre,
        fecha_entrega: refrigerio.fecha_entrega_devolucion,
        entregado_por_usuario_id: refrigerio.entregado_por_usuario_id,
      },
      detalle_ingredientes: refrigerio.detalle_ingredientes || [],
      responsable: {
        id: refrigerio.responsable?.id || refrigerio.responsable_id,
        nombre: refrigerio.responsable?.nombre || 'Responsable Asignado',
        correo: refrigerio.responsable?.correo || 'diaconia@institucion.bo',
      },
      contexto_operativo: {
        evento: refrigerio.evento?.titulo || null,
        lugar_practica: refrigerio.lugar_practica?.nombre || null,
      },
      trazabilidad_supervisor: {
        revisado_por_id: refrigerio.revisado_por_supervisor_id,
        fecha_revision: refrigerio.fecha_revision_supervisor,
        observacion: refrigerio.observacion_supervisor,
      },
      firmas_conformidad: firmas,
      total_firmas: firmas.length,
      registros_conformidad: firmas,
      total_registros_conformidad: firmas.length,
      estado_reposicion: refrigerio.estado_reposicion || 'LISTO_PARA_DESEMBOLSO',
      moneda: 'BOB (Bolivianos)',
      fecha_emision_planilla: new Date().toISOString(),
    };
  }
}
