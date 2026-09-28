import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PasajesServicio } from './pasajes.servicio';
import { SolicitudPasajes } from './entidades/solicitud-pasaje.entidad';
import { CrearSolicitudPasajeDto } from './dtos/crear-solicitud-pasaje.dto';
import { AgregarRecorridoDto } from './dtos/agregar-recorrido.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

@Controller('pasajes')
@UseGuards(JwtGuardia)
export class PasajesControlador {
  constructor(private readonly pasajesServicio: PasajesServicio) {}

  @Post()
  crear(@Body() crearSolicitudPasajeDto: CrearSolicitudPasajeDto, @UsuarioActual() usuario: Usuario): Promise<SolicitudPasajes> {
    crearSolicitudPasajeDto.becarioId = usuario.id;
    return this.pasajesServicio.crear(crearSolicitudPasajeDto);
  }

  @Post('recorridos')
  agregarRecorrido(@Body() agregarRecorridoDto: AgregarRecorridoDto, @UsuarioActual() usuario: Usuario) {
    agregarRecorridoDto.becarioId = usuario.id;
    return this.pasajesServicio.agregarRecorrido(agregarRecorridoDto);
  }

  @Get()
  obtenerTodas(): Promise<SolicitudPasajes[]> {
    return this.pasajesServicio.obtenerTodas();
  }
}
