import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Becario } from './entidades/becario.entidad';
import { HorarioApoyo } from './entidades/horario-apoyo.entidad';
import { AsignacionPractica } from './entidades/asignacion-practica.entidad';
import { ConfiguracionInstitucional } from './entidades/configuracion-institucional.entidad';
import { DocumentoSemestralBecario } from './entidades/documento-semestral-becario.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { BecariosControlador } from './becarios.controlador';
import { BecariosServicio } from './becarios.servicio';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Becario,
      Usuario,
      HorarioApoyo,
      AsignacionPractica,
      ConfiguracionInstitucional,
      DocumentoSemestralBecario,
    ]),
  ],
  controllers: [BecariosControlador],
  providers: [BecariosServicio],
  exports: [TypeOrmModule, BecariosServicio],
})
export class BecariosModulo {}
