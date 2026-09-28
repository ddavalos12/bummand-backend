import { Controller, Post, Body } from '@nestjs/common';
import { InicioSesionDto } from './dtos/inicio-sesion.dto';

@Controller('autenticacion')
export class AutenticacionControlador {
  @Post('inicio-sesion')
  iniciarSesion(@Body() inicioSesionDto: InicioSesionDto) {
    return { mensaje: 'Inicio de sesión exitoso', token: 'fake-jwt-token' };
  }
}
