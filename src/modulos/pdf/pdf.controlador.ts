import { Controller, Get, Param, Res, ParseIntPipe, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PdfServicio } from './pdf.servicio';
import { EvaluacionesServicio } from '../evaluaciones/evaluaciones.servicio';
import { JwtGuardia } from '../autenticacion/jwt.guardia';

@UseGuards(JwtGuardia)
@Controller('pdf')
export class PdfControlador {
  constructor(
    private readonly pdf_servicio: PdfServicio,
    private readonly evaluaciones_servicio: EvaluacionesServicio,
  ) {}

  @Get('evaluacion/:id')
  async generarReporteEvaluacion(@Param('id', ParseIntPipe) id: number, @Res() respuesta: Response) {
    const evaluacion = await this.evaluaciones_servicio.obtenerPorId(id);

    // HTML template canónico para el reporte de Evaluación / F-03
    const modulo_nombre = evaluacion.modulo?.nombre || 'Evaluación Integral';
    const periodo_nombre = evaluacion.periodo?.nombre || 'Periodo Actual';
    const evaluador_nombre = evaluacion.evaluador?.nombre || 'Evaluador Asignado';
    const evaluador_tipo = evaluacion.evaluador?.tipo || 'Supervisor';
    const respuestas = evaluacion.detalle_pastor?.campos_formulario || {};

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #063A6B; }
            h1 { color: #17B4C4; border-bottom: 2px solid #E3DCCB; padding-bottom: 10px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #E3F9FA; color: #17B4C4; }
            .section { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #E3DCCB; padding: 10px; text-align: left; }
            th { background: #f9f9f9; }
            .signature-box { margin-top: 50px; text-align: center; width: 300px; float: right; }
            .signature-line { border-top: 1px solid #063A6B; margin-top: 50px; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Reporte de Evaluación - BUMAND</h1>
          <p><strong>Becario:</strong> ${evaluacion.becario?.usuario?.nombre || 'Desconocido'}</p>
          <p><strong>Módulo:</strong> ${modulo_nombre}</p>
          <p><strong>Periodo:</strong> ${periodo_nombre}</p>
          <p><strong>Evaluador:</strong> ${evaluador_nombre} (${evaluador_tipo})</p>
          <p><strong>Puntaje:</strong> ${evaluacion.puntaje !== null && evaluacion.puntaje !== undefined ? evaluacion.puntaje : 'Pendiente'}</p>
          <p><strong>Estado:</strong> <span class="badge">${evaluacion.estado.toUpperCase()}</span></p>

          <div class="section">
            <h3>Respuestas / Formulario Estructurado</h3>
            <table>
              <tr><th>Campo / Ítem</th><th>Valoración</th></tr>
              ${Object.entries(respuestas).map(([key, val]) => `<tr><td>${key}</td><td>${val}</td></tr>`).join('')}
            </table>
          </div>

          <div class="section">
            <h3>Observaciones del Evaluador</h3>
            <p>${evaluacion.observaciones || 'Sin observaciones registradas.'}</p>
          </div>

          <div class="signature-box">
            <div class="signature-line">
              <strong>Firma Digital de Conformidad</strong><br/>
              Fecha: ${new Date().toLocaleDateString()}
            </div>
          </div>
        </body>
      </html>
    `;

    const buffer = await this.pdf_servicio.generarPdf(html);

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Evaluacion_${evaluacion.id}.pdf`,
      'Content-Length': buffer.length,
    });

    respuesta.end(buffer);
  }
}
