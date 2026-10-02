import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosServicio } from '../usuarios/usuarios.servicio';
import { InicioSesionDto } from './dtos/inicio-sesion.dto';
import { compararContrasena } from '../../utilidades/hash.utilidad';

@Injectable()
export class AutenticacionServicio {
  constructor(
    private readonly usuariosServicio: UsuariosServicio,
    private readonly jwtService: JwtService,
  ) {}

  async iniciarSesion(dto: InicioSesionDto) {
    const usuarios = await this.usuariosServicio.obtenerTodos();
    const usuario = usuarios.find(u => u.correo === dto.correo);
    
    if (!usuario || !(await compararContrasena(dto.contrasena, usuario.contrasena_hash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: usuario.id, correo: usuario.correo, rol: usuario.rol };
    return {
      mensaje: 'Inicio de sesión exitoso',
      token: this.jwtService.sign(payload),
    };
  }
}
