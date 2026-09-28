import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Becario } from './entidades/becario.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { BecariosControlador } from './becarios.controlador';
import { BecariosServicio } from './becarios.servicio';

@Module({
  imports: [TypeOrmModule.forFeature([Becario, Usuario])],
  controllers: [BecariosControlador],
  providers: [BecariosServicio],
  exports: [TypeOrmModule, BecariosServicio],
})
export class BecariosModulo {}
