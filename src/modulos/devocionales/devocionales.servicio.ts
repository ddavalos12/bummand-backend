import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Devocional } from './entidades/devocional.entidad';
import { CrearDevocionalDto } from './dtos/crear-devocional.dto';
import { RetroalimentarDevocionalDto } from './dtos/retroalimentar-devocional.dto';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Optional } from '@nestjs/common';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';

@Injectable()
export class DevocionalesServicio {
  constructor(
    @InjectRepository(Devocional)
    private readonly devocionalRepositorio: Repository<Devocional>,
    @InjectRepository(Becario)
    private readonly becarioRepositorio: Repository<Becario>,
    @Optional()
    private readonly tiempoRealGateway?: TiempoRealGateway,
  ) {}

  async crear(dto: CrearDevocionalDto, usuario_id?: number): Promise<Devocional> {
    let becario_id = dto.becario_id;

    if (!becario_id && usuario_id) {
      const becario = await this.becarioRepositorio.findOne({
        where: [{ usuario_id }, { id: usuario_id }],
      });
      if (!becario) {
        throw new BadRequestException('Perfil de becario no encontrado para este usuario.');
      }
      becario_id = becario.id;
    }

    if (!becario_id) {
      throw new BadRequestException('El campo becario_id es obligatorio.');
    }

    const nuevo_devocional = this.devocionalRepositorio.create({
      becario_id,
      fecha: new Date(dto.fecha),
      cita_biblica: dto.cita_biblica,
      titulo: dto.titulo,
      reflexion: dto.reflexion,
      oracion_peticion: dto.oracion_peticion,
      revisado_por_pastor: false,
    });

    const guardado = await this.devocionalRepositorio.save(nuevo_devocional);
    this.tiempoRealGateway?.notificarDevocional({ accion: 'crear', devocional: guardado });
    return guardado;
  }

  async obtenerTodos(): Promise<Devocional[]> {
    return this.devocionalRepositorio.find({
      relations: { becario: { usuario: true } },
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }

  async obtenerPorBecario(becario_id: number): Promise<Devocional[]> {
    const becario = await this.becarioRepositorio.findOne({
      where: [{ id: becario_id }, { usuario_id: becario_id }],
    });
    const id_busqueda = becario ? becario.id : becario_id;

    return this.devocionalRepositorio.find({
      where: { becario_id: id_busqueda },
      order: { fecha: 'DESC', created_at: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Devocional> {
    const devocional = await this.devocionalRepositorio.findOne({
      where: { id },
      relations: { becario: { usuario: true } },
    });

    if (!devocional) {
      throw new NotFoundException(`Devocional con ID ${id} no encontrado.`);
    }

    return devocional;
  }

  async retroalimentarPastor(id: number, dto: RetroalimentarDevocionalDto): Promise<Devocional> {
    const devocional = await this.obtenerPorId(id);
    devocional.comentario_pastoral = dto.comentario_pastoral;
    devocional.revisado_por_pastor = true;
    const guardado = await this.devocionalRepositorio.save(devocional);
    this.tiempoRealGateway?.notificarDevocional({ accion: 'retroalimentar', devocional: guardado });
    return guardado;
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const devocional = await this.obtenerPorId(id);
    await this.devocionalRepositorio.remove(devocional);
    this.tiempoRealGateway?.notificarDevocional({ accion: 'eliminar', id });
    return { mensaje: 'Devocional eliminado satisfactoriamente.' };
  }
}
