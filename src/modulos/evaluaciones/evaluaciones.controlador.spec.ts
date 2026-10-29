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
      obtenerBecariosAsignadosModulo3: jest.fn().mockResolvedValue([{ becario_id: 1, evaluado: true }]),
      obtenerEvaluacionModulo3Becario: jest.fn().mockResolvedValue({ evaluado: true, evaluacion: { id: 1 } }),
      subirDocumentoAcademico: jest.fn().mockResolvedValue({ id: 1, estado: 'en_revision_administracion' }),
      obtenerTareasEscuelaLideres: jest.fn().mockResolvedValue({ tareas: [], resumen: { total: 12 } }),
      entregarTareaEscuelaLideres: jest.fn().mockResolvedValue({ id: 1, estado: 'entregado' }),
      revisarEntregaEscuelaLideres: jest.fn().mockResolvedValue({ entrega: { id: 1, estado: 'revisado' } }),
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

  it('debe listar becarios asignados al supervisor para Módulo 3', async () => {
    const usuario = { id: 10, nombre: 'Angel Ali' } as any;
    const resultado = await controller.obtenerBecariosAsignadosModulo3(usuario, 2);
    expect(resultado).toBeDefined();
    expect(servicio_mock.obtenerBecariosAsignadosModulo3).toHaveBeenCalledWith(usuario, 2);
  });

  it('debe obtener la evaluación previa del Módulo 3 de un becario', async () => {
    const resultado = await controller.obtenerEvaluacionModulo3Becario(1, 2);
    expect(resultado).toBeDefined();
    expect(servicio_mock.obtenerEvaluacionModulo3Becario).toHaveBeenCalledWith(1, 2);
  });

  it('debe subir documento académico para revisión directa de administración', async () => {
    const usuario = { id: 5, nombre: 'Estudiante' } as any;
    const dto = { periodo_id: 2, tipo_documento: 'record_academico' } as any;
    const archivo = { filename: 'doc.pdf', originalname: 'doc.pdf' };
    const resultado = await controller.subirDocumentoAcademico(dto, archivo, usuario);
    expect(resultado).toBeDefined();
    expect(servicio_mock.subirDocumentoAcademico).toHaveBeenCalledWith(dto, archivo, usuario);
  });

  it('debe listar las tareas de escuela de líderes CETI', async () => {
    const usuario = { id: 5, nombre: 'Estudiante' } as any;
    const resultado = await controller.obtenerTareasEscuelaLideres(usuario, 1, 2);
    expect(resultado).toBeDefined();
    expect(servicio_mock.obtenerTareasEscuelaLideres).toHaveBeenCalledWith(usuario, 1, 2);
  });

  it('debe entregar una tarea de escuela de líderes CETI', async () => {
    const usuario = { id: 5, nombre: 'Estudiante' } as any;
    const dto = { periodo_id: 2, tarea_numero: 1, archivo_evidencia_url: '/evidencia.pdf', nombre_archivo: 'ev.pdf' };
    const resultado = await controller.entregarTareaLideres(dto, usuario);
    expect(resultado).toBeDefined();
    expect(servicio_mock.entregarTareaEscuelaLideres).toHaveBeenCalledWith(dto, usuario);
  });

  it('debe revisar y calificar una entrega de escuela de líderes CETI', async () => {
    const usuario = { id: 10, nombre: 'Facilitador' } as any;
    const dto = { estado: 'revisado' as any, puntaje_obtenido: 8.33 };
    const resultado = await controller.revisarEntregaLideres(1, dto, usuario);
    expect(resultado).toBeDefined();
    expect(servicio_mock.revisarEntregaEscuelaLideres).toHaveBeenCalledWith(1, dto, usuario);
  });
});
