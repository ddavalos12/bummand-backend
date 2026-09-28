import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Iglesia } from './entidades/iglesia.entidad';
import { CrearIglesiaDto } from './dtos/crear-iglesia.dto';
import { ActualizarIglesiaDto } from './dtos/actualizar-iglesia.dto';

@Injectable()
export class IglesiasServicio {
  constructor(
    @InjectRepository(Iglesia)
    private readonly repositorio: Repository<Iglesia>,
  ) {}

  crear(dto: CrearIglesiaDto): Promise<Iglesia> {
    const nueva = this.repositorio.create(dto);
    return this.repositorio.save(nueva);
  }

  listar(): Promise<Iglesia[]> {
    return this.repositorio.find({ order: { id: 'ASC' } });
  }

  async obtener(id: number): Promise<Iglesia> {
    const iglesia = await this.repositorio.findOne({ where: { id } });
    if (!iglesia) throw new NotFoundException('Iglesia no encontrada');
    return iglesia;
  }

  async actualizar(id: number, dto: ActualizarIglesiaDto): Promise<Iglesia> {
    const iglesia = await this.obtener(id);
    if (dto.nombre !== undefined) {
      iglesia.nombre = dto.nombre;
    }
    return this.repositorio.save(iglesia);
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const iglesia = await this.obtener(id);
    await this.repositorio.remove(iglesia);
    return { mensaje: 'Iglesia eliminada correctamente' };
  }
}
