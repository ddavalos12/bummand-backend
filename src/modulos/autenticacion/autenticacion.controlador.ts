import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InicioSesionDto } from './dtos/inicio-sesion.dto';
import { AutenticacionServicio } from './autenticacion.servicio';

@ApiTags('Autenticación')
@Controller('autenticacion')
export class AutenticacionControlador {
  constructor(private readonly autenticacionServicio: AutenticacionServicio) {}

  @Post('inicio-sesion')
  @ApiOperation({
    summary: 'Iniciar sesión institucional',
    description: 'Valida las credenciales corporativas (correo y contraseña) y emite un token JWT de acceso institucional.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión iniciada satisfactoriamente. Retorna el token de acceso y los metadatos del usuario.',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        usuario: {
          id: 1,
          nombre: 'Nilda Churata',
          correo: 'nilda.churata@diaconia.bo',
          rol: 'becario',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o cuenta institucional deshabilitada.',
  })
  iniciarSesion(@Body() inicioSesionDto: InicioSesionDto) {
    return this.autenticacionServicio.iniciarSesion(inicioSesionDto);
  }
}
