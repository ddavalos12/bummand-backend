import { SetMetadata } from '@nestjs/common';
import { Rol } from '../usuarios/entidades/usuario.entidad';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
