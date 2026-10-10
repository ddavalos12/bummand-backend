import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevocionalesControlador } from './devocionales.controlador';
import { DevocionalesServicio } from './devocionales.servicio';
import { Devocional } from './entidades/devocional.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';

@Module({
  imports: [TypeOrmModule.forFeature([Devocional, Becario])],
  controllers: [DevocionalesControlador],
  providers: [DevocionalesServicio],
  exports: [TypeOrmModule, DevocionalesServicio],
})
export class DevocionalesModulo {}
