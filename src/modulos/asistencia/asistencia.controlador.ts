import { Controller, Get, Post, Body } from '@nestjs/common';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';

@Controller('asistencia')
export class AsistenciaControlador {
  constructor(private readonly asistenciaServicio: AsistenciaServicio) {}

  @Post('ingreso')
  registrarIngreso(@Body() coordenadasDto: CoordenadasDto) {
    return this.asistenciaServicio.registrarIngreso(coordenadasDto);
  }

  @Post('salida')
  registrarSalida(@Body() coordenadasDto: CoordenadasDto) {
    return this.asistenciaServicio.registrarSalida(coordenadasDto);
  }

  @Get()
  obtenerTodos(): Promise<RegistroAsistencia[]> {
    return this.asistenciaServicio.obtenerTodos();
  }
}
