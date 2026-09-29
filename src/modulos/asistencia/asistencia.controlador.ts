import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { CoordenadasDto } from './dtos/coordenadas.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

@Controller('asistencia')
@UseGuards(JwtGuardia)
export class AsistenciaControlador {
  constructor(private readonly asistenciaServicio: AsistenciaServicio) {}

  @Post('ingreso')
  registrarIngreso(@Body() coordenadasDto: CoordenadasDto, @UsuarioActual() usuario: Usuario) {
    coordenadasDto.becario_id = usuario.id; // Asumimos id=becario_id por ahora
    return this.asistenciaServicio.registrarIngreso(coordenadasDto);
  }

  @Post('salida')
  registrarSalida(@Body() coordenadasDto: CoordenadasDto, @UsuarioActual() usuario: Usuario) {
    coordenadasDto.becario_id = usuario.id;
    return this.asistenciaServicio.registrarSalida(coordenadasDto);
  }

  @Get()
  obtenerTodos(): Promise<RegistroAsistencia[]> {
    return this.asistenciaServicio.obtenerTodos();
  }
}


