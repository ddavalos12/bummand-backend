import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../usuarios/entidades/usuario.entidad';

export const UsuarioActual = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest();
    return request.usuario;
  },
);
