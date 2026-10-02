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
          useValue: { generarPdf: jest.fn() },
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
});
