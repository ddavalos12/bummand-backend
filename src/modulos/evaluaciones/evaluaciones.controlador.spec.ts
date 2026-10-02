import { Test, TestingModule } from '@nestjs/testing';
import { EvaluacionesControlador } from './evaluaciones.controlador';
import { EvaluacionesServicio } from './evaluaciones.servicio';

describe('EvaluacionesControlador', () => {
  let controller: EvaluacionesControlador;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluacionesControlador],
      providers: [
        {
          provide: EvaluacionesServicio,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<EvaluacionesControlador>(EvaluacionesControlador);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
