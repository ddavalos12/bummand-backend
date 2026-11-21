import { Global, Module } from '@nestjs/common';
import { AlmacenamientoControlador } from './almacenamiento.controlador';
import { AlmacenamientoServicio } from './almacenamiento.servicio';

@Global()
@Module({
  controllers: [AlmacenamientoControlador],
  providers: [AlmacenamientoServicio],
  exports: [AlmacenamientoServicio],
})
export class AlmacenamientoModulo {}
