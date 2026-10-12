import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refrigerio } from './entidades/refrigerio.entidad';
import { CrearRefrigerioDto } from './dtos/crear-refrigerio.dto';
import { ActualizarRefrigerioDto } from './dtos/actualizar-refrigerio.dto';

export interface PlanillaReposicionRefrigerio {
  codigo_formulario: string;
  refrigerio_id: number;
  fecha: string;
  concepto: string;
  cantidad_raciones: number;
  costo_unitario_bs: number;
  costo_total_bs: number;
  responsable: {
    id: number;
    nombre: string;
    correo: string;
  };
  contexto_operativo: {
    evento?: string | null;
    lugar_practica?: string | null;
  };
  firmas_conformidad: Record<string, unknown>[];
  total_firmas: number;
  estado_reposicion: 'LISTO_PARA_DESEMBOLSO';
  moneda: 'BOB (Bolivianos)';
  fecha_emision_planilla: string;
}

@Injectable()
export class RefrigeriosServicio {
  constructor(
    @InjectRepository(Refrigerio)
    private readonly refrigerio_repo: Repository<Refrigerio>,
  ) {}

  async crear(dto: CrearRefrigerioDto): Promise<Refrigerio> {
    const raciones = Number(dto.cantidad_raciones);
    const unitario = Number(dto.costo_unitario_bs);
    const total_calculado = dto.costo_total_bs !== undefined
      ? Number(dto.costo_total_bs)
      : Number((raciones * unitario).toFixed(2));

    const nuevo_refrigerio = this.refrigerio_repo.create({
      fecha: new Date(dto.fecha),
      evento_id: dto.evento_id || null,
      lugar_practica_id: dto.lugar_practica_id || null,
      descripcion: dto.descripcion,
      cantidad_raciones: raciones,
      costo_unitario_bs: unitario,
      costo_total_bs: total_calculado,
      responsable_id: dto.responsable_id,
      firmas_conformidad: dto.firmas_conformidad || null,
    });

    return this.refrigerio_repo.save(nuevo_refrigerio);
  }

  async listar(): Promise<Refrigerio[]> {
    return this.refrigerio_repo.find({
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
    if (dto.costo_unitario_bs !== undefined) refrigerio.costo_unitario_bs = Number(dto.costo_unitario_bs);

    if (dto.costo_total_bs !== undefined) {
      refrigerio.costo_total_bs = Number(dto.costo_total_bs);
    } else if (dto.cantidad_raciones !== undefined || dto.costo_unitario_bs !== undefined) {
      refrigerio.costo_total_bs = Number(
        (refrigerio.cantidad_raciones * refrigerio.costo_unitario_bs).toFixed(2),
      );
    }

    if (dto.responsable_id !== undefined) refrigerio.responsable_id = dto.responsable_id;
    if (dto.firmas_conformidad !== undefined) refrigerio.firmas_conformidad = dto.firmas_conformidad || null;

    return this.refrigerio_repo.save(refrigerio);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const refrigerio = await this.obtenerPorId(id);
    await this.refrigerio_repo.remove(refrigerio);
    return { mensaje: `Refrigerio con ID ${id} eliminado satisfactoriamente` };
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
      responsable: {
        id: refrigerio.responsable?.id || refrigerio.responsable_id,
        nombre: refrigerio.responsable?.nombre || 'Responsable Asignado',
        correo: refrigerio.responsable?.correo || 'diaconia@institucion.bo',
      },
      contexto_operativo: {
        evento: refrigerio.evento?.titulo || null,
        lugar_practica: refrigerio.lugar_practica?.nombre || null,
      },
      firmas_conformidad: firmas,
      total_firmas: firmas.length,
      estado_reposicion: 'LISTO_PARA_DESEMBOLSO',
      moneda: 'BOB (Bolivianos)',
      fecha_emision_planilla: new Date().toISOString(),
    };
  }
}
