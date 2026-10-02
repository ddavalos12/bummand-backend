import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfServicio } from './pdf.servicio';
import { PdfControlador } from './pdf.controlador';
import { EvaluacionesModulo } from '../evaluaciones/evaluaciones.modulo';
import { ReporteGenerado } from './entidades/reporte-generado.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReporteGenerado]),
    EvaluacionesModulo,
  ],
  controllers: [PdfControlador],
  providers: [PdfServicio],
  exports: [TypeOrmModule, PdfServicio],
})
export class PdfModulo {}
