import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EvaluacionesServicio, PESOS_PONDERADOS_MODULOS } from './evaluaciones.servicio';
import { Evaluacion, EstadoEvaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion, EstadoPeriodo } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';

describe('EvaluacionesServicio', () => {
  let servicio: EvaluacionesServicio;
  let evaluacion_repo: any;
  let modulo_repo: any;
  let periodo_repo: any;
  let evaluador_repo: any;
  let evaluacion_pastor_repo: any;

  beforeEach(async () => {
    evaluacion_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    modulo_repo = {
      find: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d })),
    };

    periodo_repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d })),
    };

    evaluador_repo = {
      find: jest.fn(),
    };

    evaluacion_pastor_repo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: d.id || 1 })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluacionesServicio,
        { provide: getRepositoryToken(Evaluacion), useValue: evaluacion_repo },
        { provide: getRepositoryToken(ModuloEvaluacion), useValue: modulo_repo },
        { provide: getRepositoryToken(PeriodoEvaluacion), useValue: periodo_repo },
        { provide: getRepositoryToken(Evaluador), useValue: evaluador_repo },
        { provide: getRepositoryToken(EvaluacionPastor), useValue: evaluacion_pastor_repo },
      ],
    }).compile();

    servicio = module.get<EvaluacionesServicio>(EvaluacionesServicio);
  });

  describe('Cálculo matemático de Calificación Total (Pesos Ponderados de los 5 Módulos)', () => {
    it('debe sumar el 100% de los pesos ponderados entre los 5 módulos', () => {
      const suma_pesos = Object.values(PESOS_PONDERADOS_MODULOS).reduce(
        (acc, m) => acc + m.peso_porcentaje,
        0,
      );
      expect(suma_pesos).toBe(100);
      expect(Object.keys(PESOS_PONDERADOS_MODULOS).length).toBe(5);
    });

    it('debe calcular correctamente la calificación total y escala vigesimal con puntajes ponderados', () => {
      // Mod 1 (25%): 92 -> 23.00
      // Mod 2 (20%): 88 -> 17.60
      // Mod 3 (25%): 95 -> 23.75
      // Mod 4 (15%): 85 -> 12.75
      // Mod 5 (15%): 90 -> 13.50
      // Total: 23.00 + 17.60 + 23.75 + 12.75 + 13.50 = 90.60
      // Vigesimal: 90.60 * 0.2 = 18.12
      const resultado = servicio.calcularCalificacionPonderadaDirecta({
        1: 92,
        2: 88,
        3: 95,
        4: 85,
        5: 90,
      });

      expect(resultado.calificacion_total_100).toBe(90.6);
      expect(resultado.calificacion_vigesimal).toBe(18.12);
      expect(resultado.rendimiento).toBe('Sobresaliente');
    });

    it('debe calcular la calificación total consultando los registros de BD para un becario y periodo', async () => {
      evaluacion_repo.find.mockResolvedValue([
        { modulo_id: 1, puntaje: 90, estado: EstadoEvaluacion.COMPLETADO, modulo: { nombre: 'Liderazgo en la Iglesia' } },
        { modulo_id: 2, puntaje: 80, estado: EstadoEvaluacion.COMPLETADO, modulo: { nombre: 'Autoevaluación Académica' } },
        { modulo_id: 3, puntaje: 70, estado: EstadoEvaluacion.COMPLETADO, modulo: { nombre: 'Evaluación del Mentor' } },
        { modulo_id: 4, puntaje: 80, estado: EstadoEvaluacion.COMPLETADO, modulo: { nombre: 'Escuela de Líderes' } },
        { modulo_id: 5, puntaje: 60, estado: EstadoEvaluacion.COMPLETADO, modulo: { nombre: 'Evaluación Socioeconómica' } },
      ]);

      // Mod 1: 90 * 0.25 = 22.50
      // Mod 2: 80 * 0.20 = 16.00
      // Mod 3: 70 * 0.25 = 17.50
      // Mod 4: 80 * 0.15 = 12.00
      // Mod 5: 60 * 0.15 = 9.00
      // Total = 22.5 + 16 + 17.5 + 12 + 9 = 77.00
      // Vigesimal = 77 * 0.2 = 15.40
      const resultado = await servicio.calcularCalificacionTotal(1, 2);

      expect(resultado.calificacion_total_100).toBe(77.0);
      expect(resultado.calificacion_vigesimal).toBe(15.4);
      expect(resultado.rendimiento).toBe('Bueno');
      expect(resultado.es_completa).toBe(true);
      expect(resultado.modulos_evaluados).toBe(5);
      expect(resultado.detalles.length).toBe(5);
    });

    it('debe manejar módulos pendientes asignando puntaje 0 y calculando la ponderación parcial', async () => {
      evaluacion_repo.find.mockResolvedValue([
        { modulo_id: 1, puntaje: 100, estado: EstadoEvaluacion.COMPLETADO },
      ]);

      // Solo Mod 1: 100 * 0.25 = 25.00
      const resultado = await servicio.calcularCalificacionTotal(1, 2);

      expect(resultado.calificacion_total_100).toBe(25.0);
      expect(resultado.es_completa).toBe(false);
      expect(resultado.modulos_evaluados).toBe(1);
      expect(resultado.rendimiento).toBe('Insuficiente');
    });
  });

  describe('Formulario F-03 Pastoral y Estado de Periodos', () => {
    it('debe registrar el Formulario F-03 pastoral y actualizar puntaje de la evaluación', async () => {
      evaluacion_repo.findOne.mockResolvedValue({
        id: 1,
        modulo_id: 1,
        puntaje: null,
        estado: EstadoEvaluacion.PENDIENTE,
      });
      evaluacion_pastor_repo.findOne.mockResolvedValue(null);

      const f03_dto = {
        pastor_nombre: 'Pr. Juan Carlos',
        pastor_correo: 'pastor@iglesia.bo',
        iglesia_nombre: 'Iglesia Central',
        puntaje: 95.0,
        observaciones: 'Excelente vocación pastoral',
        campos_formulario: { compromiso: 'Sí', testimonio: 'Intachable' },
      };

      const resultado = await servicio.registrarFormularioF03(1, f03_dto);

      expect(resultado).toBeDefined();
      expect(resultado.pastor_nombre).toBe('Pr. Juan Carlos');
      expect(evaluacion_repo.save).toHaveBeenCalled();
    });

    it('debe cambiar el estado de un periodo académico entre abierto y cerrado', async () => {
      periodo_repo.findOne.mockResolvedValue({
        id: 2,
        nombre: 'Semestre II · 2026',
        estado: EstadoPeriodo.ABIERTO,
      });

      const periodo_actualizado = await servicio.cambiarEstadoPeriodo(2, EstadoPeriodo.CERRADO);

      expect(periodo_actualizado.estado).toBe(EstadoPeriodo.CERRADO);
      expect(periodo_repo.save).toHaveBeenCalled();
    });

    it('debe asegurar que se listen los 5 módulos semestrales canónicos', async () => {
      modulo_repo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([
        { id: 1, orden: 1, nombre: 'Liderazgo en la Iglesia (Formulario F-03)' },
        { id: 2, orden: 2, nombre: 'Autoevaluación Académica' },
        { id: 3, orden: 3, nombre: 'Evaluación del Mentor / Prácticas' },
        { id: 4, orden: 4, nombre: 'Evaluación Escuela de Líderes' },
        { id: 5, orden: 5, nombre: 'Evaluación Socioeconómica' },
      ]);

      const modulos = await servicio.listarModulos();

      expect(modulos.length).toBe(5);
      expect(modulo_repo.save).toHaveBeenCalledTimes(5);
    });

    it('debe rechazar la creación de un periodo si los pesos no suman 100%', async () => {
      await expect(
        servicio.crearPeriodo({
          nombre: 'Periodo Inválido',
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-06-30',
          peso_academica: 30,
          peso_liderazgo: 30,
          peso_practicas: 30,
          peso_mentor: 10,
          peso_socioeconomica: 10, // Suma = 110
        }),
      ).rejects.toThrow('La suma de los pesos porcentuales debe ser exactamente 100');
    });

    it('debe crear un periodo exitosamente cuando los pesos suman 100%', async () => {
      periodo_repo.save.mockImplementation((p) => Promise.resolve({ ...p, id: 10 }));

      const periodo = await servicio.crearPeriodo({
        nombre: 'Periodo Válido',
        fecha_inicio: '2026-01-01',
        fecha_fin: '2026-06-30',
        peso_academica: 20,
        peso_liderazgo: 20,
        peso_practicas: 20,
        peso_mentor: 20,
        peso_socioeconomica: 20,
      });

      expect(periodo.id).toBe(10);
      expect(periodo.peso_academica).toBe(20);
      expect(periodo_repo.save).toHaveBeenCalled();
    });

    it('debe calcular calificación total respetando pesos dinámicos configurados en el periodo', async () => {
      // Periodo con 20% en cada uno de los 5 módulos
      periodo_repo.findOne.mockResolvedValue({
        id: 3,
        peso_liderazgo: 20,
        peso_academica: 20,
        peso_practicas: 20,
        peso_mentor: 20,
        peso_socioeconomica: 20,
      });

      evaluacion_repo.find.mockResolvedValue([
        { modulo_id: 1, puntaje: 100, estado: EstadoEvaluacion.COMPLETADO },
        { modulo_id: 2, puntaje: 100, estado: EstadoEvaluacion.COMPLETADO },
        { modulo_id: 3, puntaje: 100, estado: EstadoEvaluacion.COMPLETADO },
        { modulo_id: 4, puntaje: 100, estado: EstadoEvaluacion.COMPLETADO },
        { modulo_id: 5, puntaje: 50, estado: EstadoEvaluacion.COMPLETADO },
      ]);

      // 4 módulos con 100 * 0.2 = 80 + 1 módulo con 50 * 0.2 = 10 -> Total = 90
      const res = await servicio.calcularCalificacionTotal(1, 3);
      expect(res.calificacion_total_100).toBe(90.0);
      expect(res.rendimiento).toBe('Sobresaliente');
    });
  });
});
