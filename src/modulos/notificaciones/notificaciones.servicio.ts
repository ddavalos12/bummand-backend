import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entidades/notificacion.entidad';
import { CrearNotificacionDto } from './dtos/crear-notificacion.dto';

@Injectable()
export class NotificacionesServicio {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacion_repo: Repository<Notificacion>,
  ) {}

  async crear(dto: CrearNotificacionDto): Promise<Notificacion> {
    const notificacion = this.notificacion_repo.create(dto);
    return this.notificacion_repo.save(notificacion);
  }

  async listarPorUsuario(usuario_id: number): Promise<Notificacion[]> {
    return this.notificacion_repo.find({
      where: { usuario_id },
      order: { fecha_envio: 'DESC' },
    });
  }

  async marcarLeida(id: number, usuario_id: number): Promise<Notificacion> {
    const notificacion = await this.notificacion_repo.findOne({
      where: { id, usuario_id },
    });
    if (!notificacion) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }
    notificacion.leido = true;
    return this.notificacion_repo.save(notificacion);
  }

  async contarNoLeidas(usuario_id: number): Promise<number> {
    return this.notificacion_repo.count({
      where: { usuario_id, leido: false },
    });
  }
}
