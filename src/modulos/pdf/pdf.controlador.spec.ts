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
          },
        },
        {
          provide: EvaluacionesServicio,
          useValue: { obtenerPorId: jest.fn() },
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
});
