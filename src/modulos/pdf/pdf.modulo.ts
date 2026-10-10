import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfServicio } from './pdf.servicio';
import { PdfControlador } from './pdf.controlador';
import { EvaluacionesModulo } from '../evaluaciones/evaluaciones.modulo';
import { ReporteGenerado } from './entidades/reporte-generado.entidad';
import { Evento } from '../eventos/entidades/evento.entidad';
import { AsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReporteGenerado, Evento, AsistenciaEvento]),
    EvaluacionesModulo,
  ],
  controllers: [PdfControlador],
  providers: [PdfServicio],
  exports: [TypeOrmModule, PdfServicio],
})
export class PdfModulo {}
