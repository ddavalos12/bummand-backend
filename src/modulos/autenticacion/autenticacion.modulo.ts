import { Module } from '@nestjs/common';
import { AutenticacionControlador } from './autenticacion.controlador';

@Module({
  controllers: [AutenticacionControlador],
})
export class AutenticacionModulo {}
