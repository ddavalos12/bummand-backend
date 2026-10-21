import { Test, TestingModule } from '@nestjs/testing';
import { EvaluacionesControlador } from './evaluaciones.controlador';
import { EvaluacionesServicio } from './evaluaciones.servicio';

describe('EvaluacionesControlador', () => {
  let controller: EvaluacionesControlador;
  let servicio_mock: {
    obtenerCuestionarioBienestar: jest.Mock;
    actualizarCuestionarioBienestar: jest.Mock;
    obtenerConsolidadoSemestral: jest.Mock;
    procesarReceptorMentorQr: jest.Mock;
    procesarReceptorSocioeconomica: jest.Mock;
  };

  beforeEach(async () => {
    servicio_mock = {
      obtenerCuestionarioBienestar: jest.fn().mockResolvedValue([{ id: 1, numero_orden: 1 }]),
      actualizarCuestionarioBienestar: jest.fn().mockResolvedValue([{ id: 1, numero_orden: 1, titulo: 'Editada' }]),
      obtenerConsolidadoSemestral: jest.fn().mockResolvedValue({
        periodo: 'II-2025',
        total_becarios: 21,
        registros: [],
      }),
      procesarReceptorMentorQr: jest.fn().mockResolvedValue({ exito: true, puntaje_vigesimal_20: 19 }),
      procesarReceptorSocioeconomica: jest.fn().mockResolvedValue({ exito: true, puntaje_20: 18 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluacionesControlador],
      providers: [
        {
          provide: EvaluacionesServicio,
          useValue: servicio_mock,
        },
      ],
    }).compile();

    controller = module.get<EvaluacionesControlador>(EvaluacionesControlador);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('debe obtener el cuestionario oficial de bienestar universitario', async () => {
    const resultado = await controller.obtenerCuestionarioBienestar();
    expect(resultado).toBeDefined();
    expect(servicio_mock.obtenerCuestionarioBienestar).toHaveBeenCalled();
  });

  it('debe actualizar el cuestionario de bienestar universitario', async () => {
    const payload = [{ numero_orden: 1, titulo: 'Editada', enunciado: '...', opciones: [] }];
    const resultado = await controller.actualizarCuestionarioBienestar(payload as any);
    expect(resultado).toBeDefined();
    expect(servicio_mock.actualizarCuestionarioBienestar).toHaveBeenCalledWith(payload);
  });

  it('debe obtener el consolidado semestral de evaluaciones', async () => {
    const resultado = await controller.obtenerConsolidadoSemestral('II-2025');
    expect(resultado.periodo).toBe('II-2025');
    expect(resultado.total_becarios).toBe(21);
    expect(servicio_mock.obtenerConsolidadoSemestral).toHaveBeenCalledWith('II-2025');
  });

  it('debe procesar el formulario receptor mentor QR', async () => {
    const payload = {
      becario_id: 1,
      token_qr: 'token',
      nombre_mentor: 'Mentor',
      unidad_agencia: 'Iglesia',
      semestre_gestion: 'II-2025',
      calificaciones_1_18: [10],
    };
    const resultado = await controller.procesarReceptorMentorQr(payload as any);
    expect(resultado.exito).toBe(true);
    expect(servicio_mock.procesarReceptorMentorQr).toHaveBeenCalledWith(payload);
  });

  it('debe procesar el formulario receptor socioeconómica', async () => {
    const payload = {
      becario_id: 1,
      respuestas_26_preguntas: { 1: 1 },
    };
    const resultado = await controller.procesarReceptorSocioeconomica(payload as any);
    expect(resultado.exito).toBe(true);
    expect(servicio_mock.procesarReceptorSocioeconomica).toHaveBeenCalledWith(payload);
  });
});
