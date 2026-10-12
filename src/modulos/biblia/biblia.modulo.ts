import { Module } from '@nestjs/common';
import { BibliaControlador } from './biblia.controlador';
import { BibliaServicio } from './biblia.servicio';

@Module({
  controllers: [BibliaControlador],
  providers: [BibliaServicio],
  exports: [BibliaServicio],
})
export class BibliaModulo {}
