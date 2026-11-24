import { Controller, Get, Param, Query, Res, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfServicio } from './pdf.servicio';
import { EvaluacionesServicio } from '../evaluaciones/evaluaciones.servicio';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@ApiTags('PDF')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia)
@Controller(['pdf', 'api/pdf'])
export class PdfControlador {
  constructor(
    private readonly pdf_servicio: PdfServicio,
    private readonly evaluaciones_servicio: EvaluacionesServicio,
  ) {}

  @Get('evaluacion/:id')
  @ApiOperation({
    summary: 'Generar y descargar informe de evaluación en PDF',
    description: 'Renderiza mediante Puppeteer headless el informe institucional oficial (equivalente al formulario físico F-03) con trazabilidad de conformidad en sistema.',
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
  async generarReporteEvaluacion(@Param('id') id_param: string, @Res() respuesta: Response) {
    const id = isNaN(Number(id_param)) ? 1 : Number(id_param);
    const evaluacion = await this.evaluaciones_servicio.obtenerPorIdResiliente(id);
    const buffer = await this.pdf_servicio.generarPdfEvaluacionF03(evaluacion);

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
  @ApiParam({ name: 'id', description: 'Identificador del evento', type: String, example: '1' })
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
  async generarActaEvento(@Param('id') id_param: string, @Res() respuesta: Response) {
    const id = isNaN(Number(id_param)) ? 1 : Number(id_param);
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
    description: 'Genera el PDF oficial en formato apaisado (landscape) con las 14 columnas, observaciones cualitativas, rangos de aprobación y trazabilidad de conformidad en sistema.',
  })
  @ApiQuery({ name: 'periodo', required: false, description: 'Periodo o gestión (ej. II-2025)' })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio para auditoría (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin para auditoría (YYYY-MM-DD)' })
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
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ) {
    const consolidado = await this.evaluaciones_servicio.obtenerConsolidadoSemestral(periodo);
    const buffer = await this.pdf_servicio.generarReporteEvaluacionSemestralPdf(consolidado.registros);

    const periodo_limpio = (periodo || consolidado.periodo || 'II_2026').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sufijo_rango = fecha_inicio && fecha_fin ? `_${fecha_inicio}_al_${fecha_fin}` : '';
    const nombre_archivo = `Evaluacion_Semestre_${periodo_limpio}${sufijo_rango}.pdf`;

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
    description: 'Genera el expediente oficial de recorridos y solicitud de pasajes mensual de un solo estudiante, con detalle de tramos, calles declaradas, cálculo exacto del 80% y trazabilidad en sistema.',
  })
  @ApiParam({ name: 'becario_id', description: 'ID del becario o estudiante', type: Number, example: 1 })
  @ApiQuery({ name: 'mes', required: false, description: 'Mes del expediente (YYYY-MM o texto, ej. 2026-10)', example: '2026-10' })
  @ApiQuery({ name: 'solicitud_id', required: false, description: 'ID opcional de solicitud de pasaje específica' })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio para auditoría (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin para auditoría (YYYY-MM-DD)' })
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
    @Param('becario_id') becario_id_param: string,
    @Query('mes') mes: string | undefined,
    @Query('solicitud_id') solicitud_id: number | undefined,
    @Res() respuesta: Response,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ) {
    if (becario_id_param === 'todos' || isNaN(Number(becario_id_param))) {
      return this.generarPasajesGeneral(fecha_inicio, fecha_fin, respuesta);
    }
    const becario_id = Number(becario_id_param);
    const resultado = await this.pdf_servicio.generarExpedienteRecorridosEstudiantePdf({
      becario_id,
      mes,
      solicitud_id: solicitud_id ? Number(solicitud_id) : undefined,
      fecha_inicio,
      fecha_fin,
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
    description: 'Genera el kárdex oficial de asistencia mensual de un solo estudiante, con detalle de jornadas, geocercas GPS, tolerancia horaria, minutos de retraso y trazabilidad en sistema.',
  })
  @ApiParam({ name: 'becario_id', description: 'ID del becario o estudiante', type: String, example: '1' })
  @ApiQuery({ name: 'mes', required: false, description: 'Mes de asistencia (YYYY-MM o texto, ej. 2026-10)', example: '2026-10' })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio para auditoría (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin para auditoría (YYYY-MM-DD)' })
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
    @Param('becario_id') becario_id_param: string,
    @Query('mes') mes: string | undefined,
    @Res() respuesta: Response,
    @Query('fecha_inicio') fecha_inicio?: string,
    @Query('fecha_fin') fecha_fin?: string,
  ) {
    if (becario_id_param === 'todos' || isNaN(Number(becario_id_param))) {
      return this.generarAsistenciaGeneral(fecha_inicio, fecha_fin, respuesta);
    }
    const becario_id = Number(becario_id_param);
    const resultado = await this.pdf_servicio.generarAsistenciaMensualEstudiantePdf({
      becario_id,
      mes,
      fecha_inicio,
      fecha_fin,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('refrigerios/consolidado')
  @ApiOperation({
    summary: 'Generar y descargar formulario consolidado de refrigerios en PDF para Contabilidad y RSD',
    description: 'Genera el PDF con el resumen institucional para Contabilidad y RSD de los refrigerios del intervalo con desglose de duplas, montos y becarios receptores.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo binario del consolidado de refrigerios en PDF descargado.' })
  async generarConsolidadoRefrigerios(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Res() respuesta: Response,
  ) {
    const resultado = await this.pdf_servicio.generarReporteRefrigeriosConsolidadoPdf({
      fecha_inicio,
      fecha_fin,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('refrigerios/:id')
  @ApiOperation({
    summary: 'Generar y descargar planilla oficial de refrigerio en PDF para Contabilidad y RSD (TAREA-07, TAREA-15)',
    description: 'Renderiza mediante Puppeteer la planilla oficial con membrete Diaconía, los 2 becarios de la dupla, ingredientes, devolución al 100% y becario receptor único.',
  })
  @ApiParam({ name: 'id', description: 'ID del refrigerio', type: String, example: '1' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo binario del reporte de refrigerio en PDF descargado.' })
  async generarReporteRefrigerio(
    @Param('id') id_param: string,
    @Res() respuesta: Response,
  ) {
    const id = isNaN(Number(id_param)) ? 1 : Number(id_param);
    const resultado = await this.pdf_servicio.generarReporteRefrigerioPdf(id);

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('refrigerios')
  @ApiOperation({
    summary: 'Generar formulario de refrigerios en PDF para Contabilidad y RSD con intervalo de fechas (TAREA-07, TAREA-08)',
    description: 'Genera el formulario consolidado de refrigerios para Contabilidad y RSD.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo PDF consolidado descargado.' })
  async generarReporteRefrigeriosIntervalo(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Res() respuesta: Response,
  ) {
    const resultado = await this.pdf_servicio.generarReporteRefrigeriosConsolidadoPdf({
      fecha_inicio,
      fecha_fin,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get(['consolidado-auditoria', 'consolidado-contabilidad', 'formulario-contabilidad'])
  @ApiOperation({
    summary: 'Generar Formulario para Contabilidad y RSD consolidado en PDF (TAREA-08)',
    description: 'Consolida horas de asistencia, liquidación de pasajes (80%) con opción de descuento de multas y reembolsos de refrigerio (100%) para Contabilidad y RSD por intervalo de fechas.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'descontar_multas', required: false, description: 'Descontar multas de asistencia en la liquidación de pasajes (true | false, por defecto true)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo binario del Formulario para Contabilidad y RSD en PDF descargado.' })
  async generarConsolidadoAuditoria(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Res() respuesta: Response,
    @Query('descontar_multas') descontar_multas?: string,
  ) {
    const resultado = await this.pdf_servicio.generarConsolidadoAuditoriaPdf({
      fecha_inicio,
      fecha_fin,
      descontar_multas,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('pasajes-general')
  @ApiOperation({
    summary: 'Generar y descargar Formulario para Contabilidad y RSD de pasajes en PDF (TAREA-07, TAREA-01)',
    description: 'Genera el Formulario para Contabilidad y RSD de recorridos y solicitud de pasajes con detalle de tramos, calles declaradas (origen -> calles -> destino), liquidación del 80% y opción de descuento de multas.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'descontar_multas', required: false, description: 'Descontar multas de asistencia en la liquidación de pasajes (true | false, por defecto true)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo binario del consolidado general de pasajes en PDF.' })
  async generarPasajesGeneral(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Res() respuesta: Response,
    @Query('descontar_multas') descontar_multas?: string,
  ) {
    const resultado = await this.pdf_servicio.generarPasajesGeneralPdf({
      fecha_inicio,
      fecha_fin,
      descontar_multas,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('justificaciones-general')
  @ApiOperation({
    summary: 'Generar y descargar informe consolidado general de justificaciones y permisos en PDF (TAREA-07, TAREA-01)',
    description: 'Genera el PDF oficial de permisos, justificaciones de inasistencia/retraso y resoluciones de convalidación.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo binario del consolidado general de justificaciones en PDF.' })
  async generarJustificacionesGeneral(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Res() respuesta: Response,
  ) {
    const resultado = await this.pdf_servicio.generarJustificacionesGeneralPdf({
      fecha_inicio,
      fecha_fin,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('asistencia-general')
  @ApiOperation({
    summary: 'Generar y descargar informe consolidado general de asistencia en PDF (TAREA-07, TAREA-01)',
    description: 'Genera el PDF oficial de auditoría con columnas # | Becario | Fecha | Hora Prog. | Hora GPS | Horas | Retraso | Estado.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo binario del consolidado general de asistencia en PDF.' })
  async generarAsistenciaGeneral(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Res() respuesta: Response,
  ) {
    const resultado = await this.pdf_servicio.generarAsistenciaGeneralPdf({
      fecha_inicio,
      fecha_fin,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('donacion-refrigerio')
  @UseGuards(JwtGuardia, RolesGuardia)
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Generar planilla oficial PDF de Donación para Refrigerio BUMAN-D',
    description:
      'Renderiza con Puppeteer la planilla oficial de Donación para Refrigerio BUMAN-D (para Contabilidad sin columna firma o para Archivo del Área con columna firma) y 2 firmas institucionales seleccionables.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'mes', required: false, description: 'Mes de la planilla (YYYY-MM o nombre del mes)' })
  @ApiQuery({ name: 'con_firma', required: false, description: 'Incluir columna FIRMA para archivo del área (true | false)' })
  @ApiQuery({ name: 'firmante_1', required: false, description: 'Primer firmante institucional (ruth | pamela | samuel)' })
  @ApiQuery({ name: 'firmante_2', required: false, description: 'Segundo firmante institucional (ruth | pamela | samuel)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo binario de la planilla de donación de refrigerio en PDF.' })
  async generarDonacionRefrigerio(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Query('mes') mes: string | undefined,
    @Query('con_firma') con_firma: string | undefined,
    @Query('firmante_1') firmante_1: string | undefined,
    @Query('firmante_2') firmante_2: string | undefined,
    @Res() respuesta: Response,
  ) {
    const resultado = await this.pdf_servicio.generarDonacionRefrigerioPdf({
      fecha_inicio,
      fecha_fin,
      mes,
      con_firma,
      firmante_1,
      firmante_2,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('donacion-transporte')
  @UseGuards(JwtGuardia, RolesGuardia)
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Generar planilla oficial PDF de Donación para Transporte BUMAN-D',
    description:
      'Renderiza con Puppeteer la planilla oficial consolidada de Donación para Transporte BUMAN-D (todos los becarios ordenados por apellido, 80% neto con opción de descontar multas, con o sin columna firma) y 2 firmas institucionales seleccionables.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiQuery({ name: 'mes', required: false, description: 'Mes de la planilla (YYYY-MM o nombre del mes)' })
  @ApiQuery({ name: 'con_firma', required: false, description: 'Incluir columna FIRMA para archivo del área (true | false)' })
  @ApiQuery({ name: 'firmante_1', required: false, description: 'Primer firmante institucional (ruth | pamela | samuel)' })
  @ApiQuery({ name: 'firmante_2', required: false, description: 'Segundo firmante institucional (ruth | pamela | samuel)' })
  @ApiQuery({ name: 'descontar_multas', required: false, description: 'Descontar multas de asistencia del 80% reconocido (true | false, por defecto false)' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'Archivo binario de la planilla de donación de transporte en PDF.' })
  async generarDonacionTransporte(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Query('mes') mes: string | undefined,
    @Query('con_firma') con_firma: string | undefined,
    @Query('firmante_1') firmante_1: string | undefined,
    @Query('firmante_2') firmante_2: string | undefined,
    @Res() respuesta: Response,
    @Query('descontar_multas') descontar_multas?: string,
  ) {
    const resultado = await this.pdf_servicio.generarDonacionTransportePdf({
      fecha_inicio,
      fecha_fin,
      mes,
      con_firma,
      firmante_1,
      firmante_2,
      descontar_multas,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }

  @Get('asistencia-escuela-lideres')
  @ApiOperation({
    summary: 'Generar y descargar Reporte de Asistencia de Escuela de Líderes (enlazado con Multas y Permisos)',
    description:
      'Consolida las asistencias de Escuela de Líderes vinculándolas en vivo con permisos/justificaciones y multas aplicadas en el intervalo.',
  })
  @ApiQuery({ name: 'fecha_inicio', required: false, description: 'Fecha de inicio (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_fin', required: false, description: 'Fecha de fin (YYYY-MM-DD)' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'Archivo binario del Reporte de Asistencia de Escuela de Líderes con Multas y Permisos en PDF.',
  })
  async generarAsistenciaEscuelaLideres(
    @Query('fecha_inicio') fecha_inicio: string | undefined,
    @Query('fecha_fin') fecha_fin: string | undefined,
    @Res() respuesta: Response,
  ) {
    const resultado = await this.pdf_servicio.generarAsistenciaEscuelaLideresPdf({
      fecha_inicio,
      fecha_fin,
    });

    respuesta.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${resultado.nombre_archivo}`,
      'Content-Length': resultado.bufer.length,
    });

    respuesta.end(resultado.bufer);
  }
}
