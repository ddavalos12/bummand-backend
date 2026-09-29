import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { lugar_practica } from './entidades/lugar-practica.entidad';
import { CrearLugarPracticaDto } from './dtos/crear-lugar-practica.dto';
import { ActualizarLugarPracticaDto } from './dtos/actualizar-lugar-practica.dto';

@Injectable()
export class LugaresPracticaServicio {
  constructor(
    @InjectRepository(lugar_practica)
    private readonly repositorio: Repository<lugar_practica>,
  ) {}

  crear(dto: CrearLugarPracticaDto): Promise<lugar_practica> {
    const nuevo = this.repositorio.create(dto);
    return this.repositorio.save(nuevo);
  }

  listar(): Promise<lugar_practica[]> {
    return this.repositorio.find({ order: { id: 'ASC' } });
  }

  async obtener(id: number): Promise<lugar_practica> {
    const lugar = await this.repositorio.findOne({ where: { id } });
    if (!lugar) throw new NotFoundException('Lugar de práctica no encontrado');
    return lugar;
  }

  async actualizar(id: number, dto: ActualizarLugarPracticaDto): Promise<lugar_practica> {
    const lugar = await this.obtener(id);
    Object.assign(lugar, dto);
    return this.repositorio.save(lugar);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const lugar = await this.obtener(id);
    await this.repositorio.remove(lugar);
    return { mensaje: 'Lugar de práctica eliminado correctamente' };
  }
}

