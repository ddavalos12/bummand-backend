import { Controller, Get, Post, Body } from '@nestjs/common';
import { PasajesServicio } from './pasajes.servicio';
import { SolicitudPasajes } from './entidades/solicitud-pasaje.entidad';
import { CrearSolicitudPasajeDto } from './dtos/crear-solicitud-pasaje.dto';
import { AgregarRecorridoDto } from './dtos/agregar-recorrido.dto';

@Controller('pasajes')
export class PasajesControlador {
  constructor(private readonly pasajesServicio: PasajesServicio) {}

  @Post()
  crear(@Body() crearSolicitudPasajeDto: CrearSolicitudPasajeDto): Promise<SolicitudPasajes> {
    return this.pasajesServicio.crear(crearSolicitudPasajeDto);
  }

  @Post('recorridos')
  agregarRecorrido(@Body() agregarRecorridoDto: AgregarRecorridoDto) {
    return this.pasajesServicio.agregarRecorrido(agregarRecorridoDto);
  }

  @Get()
  obtenerTodas(): Promise<SolicitudPasajes[]> {
    return this.pasajesServicio.obtenerTodas();
  }
}
