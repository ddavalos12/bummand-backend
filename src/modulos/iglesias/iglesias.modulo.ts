import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Iglesia } from './entidades/iglesia.entidad';

@Module({
  imports: [TypeOrmModule.forFeature([Iglesia])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class IglesiasModulo {}
