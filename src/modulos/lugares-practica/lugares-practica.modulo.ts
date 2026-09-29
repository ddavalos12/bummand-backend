import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { lugar_practica } from './entidades/lugar-practica.entidad';
import { LugaresPracticaControlador } from './lugares-practica.controlador';
import { LugaresPracticaServicio } from './lugares-practica.servicio';

@Module({
  imports: [TypeOrmModule.forFeature([lugar_practica])],
  controllers: [LugaresPracticaControlador],
  providers: [LugaresPracticaServicio],
  exports: [TypeOrmModule, LugaresPracticaServicio],
})
export class LugaresPracticaModulo {}

