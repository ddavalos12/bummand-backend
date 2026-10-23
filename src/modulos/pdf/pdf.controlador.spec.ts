import { Test, TestingModule } from '@nestjs/testing';
import { PdfControlador } from './pdf.controlador';
import { PdfServicio } from './pdf.servicio';
import { EvaluacionesServicio } from '../evaluaciones/evaluaciones.servicio';

describe('PdfControlador', () => {
  let controller: PdfControlador;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfControlador],
      providers: [
        {
          provide: PdfServicio,
          useValue: {
            generarPdf: jest.fn(),
            generarActaEventoPdf: jest.fn().mockResolvedValue(Buffer.from('PDF_ACTA_TEST')),
            generarReporteEvaluacionSemestralPdf: jest.fn().mockResolvedValue(Buffer.from('PDF_CONSOLIDADO_TEST')),
            generarExpedienteRecorridosEstudiantePdf: jest.fn().mockResolvedValue({
              bufer: Buffer.from('PDF_RECORRIDOS_TEST'),
              nombre_archivo: 'Expediente_Recorridos_Carlos_Luna_Octubre_2026.pdf',
              nombre_estudiante: 'Carlos Luna',
              mes_nombre: 'Octubre 2026',
            }),
            generarAsistenciaMensualEstudiantePdf: jest.fn().mockResolvedValue({
              bufer: Buffer.from('PDF_ASISTENCIA_TEST'),
              nombre_archivo: 'Asistencia_Mensual_Carlos_Luna_Octubre_2026.pdf',
              nombre_estudiante: 'Carlos Luna',
              mes_nombre: 'Octubre 2026',
            }),
          },
        },
        {
          provide: EvaluacionesServicio,
          useValue: {
            obtenerPorId: jest.fn(),
            obtenerConsolidadoSemestral: jest.fn().mockResolvedValue({
              periodo: 'II-2025',
              total_becarios: 21,
              registros: [],
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<PdfControlador>(PdfControlador);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('debe generar y enviar el acta de asistencia a evento en PDF', async () => {
    const respuesta_mock = {
      set: jest.fn(),
      end: jest.fn(),
    } as any;

    await controller.generarActaEvento(1, respuesta_mock);

    expect(respuesta_mock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=Acta_Asistencia_Evento_1.pdf',
      }),
    );
    expect(respuesta_mock.end).toHaveBeenCalled();
  });

  it('debe generar y descargar el informe consolidado semestral en PDF', async () => {
    const respuesta_mock = {
      set: jest.fn(),
      end: jest.fn(),
    } as any;

    await controller.generarReporteEvaluacionSemestral('II-2025', respuesta_mock);

    expect(respuesta_mock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=Evaluacion_Semestre_II-2025.pdf',
      }),
    );
    expect(respuesta_mock.end).toHaveBeenCalled();
  });

  it('debe exportar a PDF el expediente mensual de recorridos de un estudiante', async () => {
    const respuesta_mock = {
      set: jest.fn(),
      end: jest.fn(),
    } as any;

    await controller.exportarRecorridosEstudiante(1, '2026-10', undefined, respuesta_mock);

    expect(respuesta_mock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('Expediente_Recorridos'),
      }),
    );
    expect(respuesta_mock.end).toHaveBeenCalled();
  });

  it('debe exportar a PDF la asistencia mensual de un estudiante', async () => {
    const respuesta_mock = {
      set: jest.fn(),
      end: jest.fn(),
    } as any;

    await controller.exportarAsistenciaEstudiante(1, '2026-10', respuesta_mock);

    expect(respuesta_mock.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'application/pdf',
        'Content-Disposition': expect.stringContaining('Asistencia_Mensual'),
      }),
    );
    expect(respuesta_mock.end).toHaveBeenCalled();
  });
});
