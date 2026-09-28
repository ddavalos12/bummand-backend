import { Controller, Post, Body } from '@nestjs/common';
import { InicioSesionDto } from './dtos/inicio-sesion.dto';
import { AutenticacionServicio } from './autenticacion.servicio';

@Controller('autenticacion')
export class AutenticacionControlador {
  constructor(private readonly autenticacionServicio: AutenticacionServicio) {}

  @Post('inicio-sesion')
  iniciarSesion(@Body() inicioSesionDto: InicioSesionDto) {
    return this.autenticacionServicio.iniciarSesion(inicioSesionDto);
  }
}
