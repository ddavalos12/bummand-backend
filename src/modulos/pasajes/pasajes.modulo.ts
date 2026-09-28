import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasajesControlador } from './pasajes.controlador';
import { PasajesServicio } from './pasajes.servicio';
import { SolicitudPasajes } from './entidades/solicitud-pasaje.entidad';
import { Recorrido } from './entidades/recorrido.entidad';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitudPasajes, Recorrido])],
  controllers: [PasajesControlador],
  providers: [PasajesServicio],
  exports: [TypeOrmModule, PasajesServicio],
})
export class PasajesModulo {}
