import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecorridoGpsPrueba } from './entidades/recorrido-gps-prueba.entidad';
import { RecorridosGpsPruebaControlador } from './recorridos-gps-prueba.controlador';
import { RecorridosGpsPruebaServicio } from './recorridos-gps-prueba.servicio';

@Module({
  imports: [TypeOrmModule.forFeature([RecorridoGpsPrueba])],
  controllers: [RecorridosGpsPruebaControlador],
  providers: [RecorridosGpsPruebaServicio],
  exports: [TypeOrmModule, RecorridosGpsPruebaServicio],
})
export class RecorridosGpsPruebaModulo {}
