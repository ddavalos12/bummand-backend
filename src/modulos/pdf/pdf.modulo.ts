import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfServicio } from './pdf.servicio';
import { PdfControlador } from './pdf.controlador';
import { EvaluacionesModulo } from '../evaluaciones/evaluaciones.modulo';
import { ReporteGenerado } from './entidades/reporte-generado.entidad';
import { Evento } from '../eventos/entidades/evento.entidad';
import { AsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';
import { RegistroAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReporteGenerado,
      Evento,
      AsistenciaEvento,
      RegistroAsistencia,
      Becario,
    ]),
    EvaluacionesModulo,
  ],
  controllers: [PdfControlador],
  providers: [PdfServicio],
  exports: [TypeOrmModule, PdfServicio],
})
export class PdfModulo {}
