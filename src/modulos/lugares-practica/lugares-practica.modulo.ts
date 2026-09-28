import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LugarPractica } from './entidades/lugar-practica.entidad';

@Module({
  imports: [TypeOrmModule.forFeature([LugarPractica])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class LugaresPracticaModulo {}
