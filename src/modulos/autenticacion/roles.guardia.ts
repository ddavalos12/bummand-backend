import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@Injectable()
export class RolesGuardia implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos) {
      return true;
    }

    const { usuario } = context.switchToHttp().getRequest();

    if (!usuario) {
      throw new ForbiddenException('No hay usuario autenticado');
    }

    if (rolesRequeridos.some((rol) => usuario.rol === rol)) {
      return true;
    }

    throw new ForbiddenException('No tienes permisos suficientes para esta acción');
  }
}
