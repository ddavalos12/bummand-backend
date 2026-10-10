import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InicioSesionDto } from './dtos/inicio-sesion.dto';
import { AutenticacionServicio } from './autenticacion.servicio';
import { JwtGuardia } from './jwt.guardia';
import { UsuarioActual } from './usuario-actual.decorador';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

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

  @UseGuards(JwtGuardia)
  @Post('renovar-sesion')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Renovar sesión institucional',
    description: 'Refresca el token JWT de acceso para un usuario con sesión activa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token expirado o inválido.',
  })
  renovarSesion(@UsuarioActual() usuario: Usuario) {
    return this.autenticacionServicio.renovarSesion(usuario.id);
  }
}
