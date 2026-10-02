import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AprobacionPracticas } from './entidades/aprobacion-practicas.entidad';
import { PracticasControlador } from './practicas.controlador';
import { PracticasServicio } from './practicas.servicio';

@Module({
  imports: [TypeOrmModule.forFeature([AprobacionPracticas])],
  controllers: [PracticasControlador],
  providers: [PracticasServicio],
  exports: [TypeOrmModule, PracticasServicio],
})
export class PracticasModulo {}
