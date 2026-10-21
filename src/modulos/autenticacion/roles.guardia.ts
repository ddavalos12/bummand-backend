import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@Injectable()
export class RolesGuardia implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles_requeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles_requeridos) {
      return true;
    }

    const { usuario } = context.switchToHttp().getRequest();

    if (!usuario) {
      throw new ForbiddenException('No hay usuario autenticado');
    }

    if (
      roles_requeridos.some(
        (rol) => String(usuario.rol).toLowerCase().trim() === String(rol).toLowerCase().trim(),
      )
    ) {
      return true;
    }

    if (
      roles_requeridos.length === 1 &&
      String(roles_requeridos[0]).toLowerCase().trim() === String(Rol.BECARIO).toLowerCase().trim()
    ) {
      throw new ForbiddenException(
        'Esta acción es exclusiva para estudiantes becarios. Inicia sesión con tu cuenta de estudiante.',
      );
    }

    throw new ForbiddenException('No tienes permisos suficientes para esta acción');
  }
}
