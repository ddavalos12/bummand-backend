import { Controller, Get, Param, Query, Res, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfServicio } from './pdf.servicio';
import { EvaluacionesServicio } from '../evaluaciones/evaluaciones.servicio';
import { JwtGuardia } from '../autenticacion/jwt.guardia';

@ApiTags('PDF')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia)
@Controller('pdf')
export class PdfControlador {
  constructor(
    private readonly pdf_servicio: PdfServicio,
    private readonly evaluaciones_servicio: EvaluacionesServicio,
  ) {}

  @Get('evaluacion/:id')
  @ApiOperation({
    summary: 'Generar y descargar informe de evaluación en PDF',
    description: 'Renderiza mediante Puppeteer headless el informe institucional oficial (equivalente al formulario físico F-03) con firma de conformidad.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la evaluación', type: Number, example: 1 })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Archivo binario del informe PDF oficial descargado.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada.' })
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

  @Get('evento/:id')
  @ApiOperation({
    summary: 'Generar y descargar acta oficial de asistencia a evento en PDF',
    description: 'Renderiza mediante Puppeteer el acta de control geodésico y nómina de asistentes a un evento convocado.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del evento', type: Number, example: 1 })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Archivo binario del acta PDF descargada.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 404, description: 'Evento no encontrado.' })
  async generarActaEvento(@Param('id', ParseIntPipe) id: number, @Res() respuesta: Response) {
    const buffer = await this.pdf_servicio.generarActaEventoPdf(id);

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Acta_Asistencia_Evento_${id}.pdf`,
      'Content-Length': buffer.length,
    });

    respuesta.end(buffer);
  }

  @Get('evaluacion-semestral')
  @ApiOperation({
    summary: 'Generar y descargar informe consolidado de evaluación semestral en PDF',
    description: 'Genera el PDF oficial en formato apaisado (landscape) con las 14 columnas, observaciones cualitativas, rangos de aprobación y firmas de conformidad.',
  })
  @ApiQuery({ name: 'periodo', required: false, description: 'Periodo o gestión (ej. II-2025)' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Archivo binario del consolidado semestral PDF descargado.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async generarReporteEvaluacionSemestral(
    @Query('periodo') periodo: string | undefined,
    @Res() respuesta: Response,
  ) {
    const consolidado = await this.evaluaciones_servicio.obtenerConsolidadoSemestral(periodo);
    const buffer = await this.pdf_servicio.generarReporteEvaluacionSemestralPdf(consolidado.registros);

    const periodo_limpio = (periodo || 'II_2025').replace(/[^a-zA-Z0-9_-]/g, '_');
    const nombre_archivo = `Evaluacion_Semestre_${periodo_limpio}.pdf`;

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${nombre_archivo}`,
      'Content-Length': buffer.length,
    });

    respuesta.end(buffer);
  }

  @Get('corte-asistencia')
  @ApiOperation({
    summary: 'Generar y descargar informe de corte de asistencia semanal en PDF con Puppeteer',
    description: 'Genera el PDF oficial institucional de auditoría de corte con métricas de puntualidad, retrasos y horas.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio del corte (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin del corte (YYYY-MM-DD)' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de actividad (todas, practicas, escuela_lideres, acciones_servicio)' })
  @ApiQuery({ name: 'supervisor_id', required: false, description: 'ID opcional del supervisor para filtrar' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Archivo binario del corte de asistencia en PDF descargado.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async generarCorteAsistencia(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Query('tipo') tipo: string | undefined,
    @Query('supervisor_id') supervisor_id: number | undefined,
    @Res() respuesta: Response,
  ) {
    const buffer = await this.pdf_servicio.generarCorteAsistenciaPdf({
      fecha_inicio,
      fecha_fin,
      tipo,
      supervisor_id: supervisor_id ? Number(supervisor_id) : undefined,
    });

    const nombre_archivo = `Corte_Asistencia_${(fecha_inicio || 'semanal').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${nombre_archivo}`,
      'Content-Length': buffer.length,
    });

    respuesta.end(buffer);
  }

  @Get('recorridos-estudiante/:becario_id')
  @ApiOperation({
    summary: 'Exportar a PDF el expediente mensual de recorridos de un estudiante con Puppeteer',
    description: 'Genera el expediente oficial de recorridos y solicitud de pasajes mensual de un solo estudiante, con detalle de tramos, calles declaradas, cálculo exacto del 80% y firmas.',
  })
  @ApiParam({ name: 'becario_id', description: 'ID del becario o estudiante', type: Number, example: 1 })
  @ApiQuery({ name: 'mes', required: false, description: 'Mes del expediente (YYYY-MM o texto, ej. 2026-10)', example: '2026-10' })
  @ApiQuery({ name: 'solicitud_id', required: false, description: 'ID opcional de solicitud de pasaje específica' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Archivo binario del expediente de recorridos en PDF descargado.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async exportarRecorridosEstudiante(
    @Param('becario_id', ParseIntPipe) becario_id: number,
    @Query('mes') mes: string | undefined,
    @Query('solicitud_id') solicitud_id: number | undefined,
    @Res() respuesta: Response,
  ) {
    const resultado = await this.pdf_servicio.generarExpedienteRecorridosEstudiantePdf({
      becario_id,
      mes,
      solicitud_id: solicitud_id ? Number(solicitud_id) : undefined,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('asistencia-estudiante/:becario_id')
  @ApiOperation({
    summary: 'Exportar a PDF el kárdex de asistencia mensual de un estudiante con Puppeteer',
    description: 'Genera el kárdex oficial de asistencia mensual de un solo estudiante, con detalle de jornadas, geocercas GPS, tolerancia horaria, minutos de retraso y firmas.',
  })
  @ApiParam({ name: 'becario_id', description: 'ID del becario o estudiante', type: Number, example: 1 })
  @ApiQuery({ name: 'mes', required: false, description: 'Mes de asistencia (YYYY-MM o texto, ej. 2026-10)', example: '2026-10' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Archivo binario de la asistencia mensual en PDF descargado.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async exportarAsistenciaEstudiante(
    @Param('becario_id', ParseIntPipe) becario_id: number,
    @Query('mes') mes: string | undefined,
    @Res() respuesta: Response,
  ) {
    const resultado = await this.pdf_servicio.generarAsistenciaMensualEstudiantePdf({
      becario_id,
      mes,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }
}
