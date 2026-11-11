import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosServicio } from '../usuarios/usuarios.servicio';

@Injectable()
export class JwtEstrategia extends PassportStrategy(Strategy) {
  constructor(private readonly usuariosServicio: UsuariosServicio) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    let usuario = await this.usuariosServicio.obtenerPorId(payload.sub);
    if (!usuario && payload?.correo) {
      usuario = await this.usuariosServicio.obtenerPorCorreoConRelaciones(payload.correo);
    }
    if (!usuario) {
      throw new UnauthorizedException();
    }
    return usuario;
  }
}
