import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Becario } from './entidades/becario.entidad';

@Module({
  imports: [TypeOrmModule.forFeature([Becario])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class BecariosModulo {}
