import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LugarPractica } from './entidades/lugar-practica.entidad';
import { CrearLugarPracticaDto } from './dtos/crear-lugar-practica.dto';
import { ActualizarLugarPracticaDto } from './dtos/actualizar-lugar-practica.dto';

@Injectable()
export class LugaresPracticaServicio {
  constructor(
    @InjectRepository(LugarPractica)
    private readonly repositorio: Repository<LugarPractica>,
  ) {}

  crear(dto: CrearLugarPracticaDto): Promise<LugarPractica> {
    const nuevo = this.repositorio.create(dto);
    return this.repositorio.save(nuevo);
  }

  listar(): Promise<LugarPractica[]> {
    return this.repositorio.find({ order: { id: 'ASC' } });
  }

  async obtener(id: number): Promise<LugarPractica> {
    const lugar = await this.repositorio.findOne({ where: { id } });
    if (!lugar) throw new NotFoundException('Lugar de práctica no encontrado');
    return lugar;
  }

  async actualizar(id: number, dto: ActualizarLugarPracticaDto): Promise<LugarPractica> {
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

