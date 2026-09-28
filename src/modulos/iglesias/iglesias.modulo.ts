import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Iglesia } from './entidades/iglesia.entidad';
import { IglesiasControlador } from './iglesias.controlador';
import { IglesiasServicio } from './iglesias.servicio';

@Module({
  imports: [TypeOrmModule.forFeature([Iglesia])],
  controllers: [IglesiasControlador],
  providers: [IglesiasServicio],
  exports: [TypeOrmModule, IglesiasServicio],
})
export class IglesiasModulo {}
