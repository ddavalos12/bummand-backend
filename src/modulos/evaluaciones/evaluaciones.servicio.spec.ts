import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EvaluacionesServicio, PESOS_PONDERADOS_MODULOS } from './evaluaciones.servicio';
import { Evaluacion, EstadoEvaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion, EstadoPeriodo } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';
import { PreguntaBienestar } from './entidades/pregunta-bienestar.entidad';
import { EntregaTareaLideres, EstadoEntregaTarea } from './entidades/entrega-tarea-lideres.entidad';
import { DocumentoSemestralBecario } from '../becarios/entidades/documento-semestral-becario.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

describe('EvaluacionesServicio', () => {
  let servicio: EvaluacionesServicio;
  let evaluacion_repo: any;
  let modulo_repo: any;
  let periodo_repo: any;
  let evaluador_repo: any;
  let evaluacion_pastor_repo: any;
  let pregunta_bienestar_repo: any;
  let becario_repo: any;
  let entrega_tarea_repo: any;
  let documento_semestral_repo: any;

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
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: d.id || 1 })),
    };

    evaluacion_pastor_repo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: d.id || 1 })),
    };

    pregunta_bienestar_repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: d.id || 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };

    becario_repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };

    entrega_tarea_repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: d.id || 1 })),
    };

    documento_semestral_repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: d.id || 1 })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluacionesServicio,
        { provide: getRepositoryToken(Evaluacion), useValue: evaluacion_repo },
        { provide: getRepositoryToken(ModuloEvaluacion), useValue: modulo_repo },
        { provide: getRepositoryToken(PeriodoEvaluacion), useValue: periodo_repo },
        { provide: getRepositoryToken(Evaluador), useValue: evaluador_repo },
        { provide: getRepositoryToken(EvaluacionPastor), useValue: evaluacion_pastor_repo },
        { provide: getRepositoryToken(PreguntaBienestar), useValue: pregunta_bienestar_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
        { provide: getRepositoryToken(EntregaTareaLideres), useValue: entrega_tarea_repo },
        { provide: getRepositoryToken(DocumentoSemestralBecario), useValue: documento_semestral_repo },
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

  describe('Cuestionario Oficial de Bienestar Universitario (26 preguntas)', () => {
    it('debe retornar las 26 preguntas canónicas por defecto si la base de datos está vacía', async () => {
      pregunta_bienestar_repo.find.mockResolvedValue([]);
      const preguntas = await servicio.obtenerCuestionarioBienestar();
      expect(preguntas.length).toBe(26);
      expect(preguntas[0].numero_orden).toBe(1);
      expect(preguntas[25].numero_orden).toBe(26);
    });

    it('debe actualizar y guardar preguntas modificadas del cuestionario de bienestar', async () => {
      const payload = [
        {
          numero_orden: 1,
          titulo: 'Horas de sueño modificada',
          enunciado: '¿Cuántas horas duerme?',
          categoria: 'salud_bienestar',
          opciones: ['Menos de 6', 'Entre 6 y 8', 'Más de 8'],
          activa: true,
        },
      ];
      pregunta_bienestar_repo.findOne.mockResolvedValue(null);
      pregunta_bienestar_repo.save.mockImplementation((ent: any) => Promise.resolve(ent));
      pregunta_bienestar_repo.find.mockResolvedValue(payload);

      const res = await servicio.actualizarCuestionarioBienestar(payload);
      expect(res.length).toBe(1);
      expect(res[0].titulo).toBe('Horas de sueño modificada');
    });
  });

  describe('Criterios Oficiales de Evaluación y Consolidado Semestral', () => {
    it('debe calcular puntaje académico por criterio según promedio y reprobadas', () => {
      // >= 70 sin reprobadas: 20 pts
      expect(servicio.calcularPuntajeAcademicoPorCriterio(75, 0)).toBe(20);
      // < 70 sin reprobadas: 15 pts
      expect(servicio.calcularPuntajeAcademicoPorCriterio(65, 0)).toBe(15);
      // 1 materia reprobada y promedio > 51: 10 pts
      expect(servicio.calcularPuntajeAcademicoPorCriterio(80, 1)).toBe(10);
      // 1 materia reprobada y promedio <= 51: 0 pts
      expect(servicio.calcularPuntajeAcademicoPorCriterio(50, 1)).toBe(0);
      // Más de una materia reprobada: 0 pts
      expect(servicio.calcularPuntajeAcademicoPorCriterio(70, 2)).toBe(0);
      expect(servicio.calcularPuntajeAcademicoPorCriterio(70, 3)).toBe(0);
    });

    it('debe retornar la calificación literal oficial exacta según el total sobre 100', () => {
      expect(servicio.obtenerCalificacionLiteralOficial(70)).toBe('Aprobación óptima');
      expect(servicio.obtenerCalificacionLiteralOficial(100)).toBe('Aprobación óptima');
      expect(servicio.obtenerCalificacionLiteralOficial(69)).toBe('Aprobación Condicionada');
      expect(servicio.obtenerCalificacionLiteralOficial(51)).toBe('Aprobación Condicionada');
      expect(servicio.obtenerCalificacionLiteralOficial(50)).toBe('Reprobó y debe abandonar el programa');
      expect(servicio.obtenerCalificacionLiteralOficial(0)).toBe('Reprobó y debe abandonar el programa');
    });

    it('debe obtener el consolidado semestral con los 21 becarios canónicos, criterios y rangos', async () => {
      const consolidado = await servicio.obtenerConsolidadoSemestral('II-2025');
      expect(consolidado.periodo).toBe('II-2025');
      expect(consolidado.total_becarios).toBe(21);
      expect(consolidado.registros.length).toBe(21);
      expect(consolidado.criterios_oficiales).toBeDefined();
      expect(consolidado.rangos_aprobacion.length).toBe(3);

      const primer_becario = consolidado.registros[0];
      expect(primer_becario.nombre_completo).toBe('Jose Marcos Suñagua Quispe');
      expect(primer_becario.total).toBe(68);
      expect(primer_becario.ceti_tareas.length).toBe(12);
    });
  });

  describe('Procesamiento de Evaluaciones Mentor QR y Socioeconómica', () => {
    it('debe procesar receptor mentor QR calculando puntaje vigesimal sobre 20', async () => {
      periodo_repo.findOne.mockResolvedValue({ id: 1, estado: EstadoPeriodo.ACTIVO });
      modulo_repo.find.mockResolvedValue([{ id: 3, clave_sistema: 'evaluacion_mentor' }]);
      evaluador_repo.find.mockResolvedValue([{ id: 1, nombre: 'Mentor Test' }]);
      evaluacion_repo.findOne.mockResolvedValue(null);
      evaluacion_repo.save.mockImplementation((d: any) => Promise.resolve({ ...d, id: 99 }));

      const resultado = await servicio.procesarReceptorMentorQr({
        becario_id: 1,
        token_qr: 'token_prueba',
        nombre_mentor: 'David Limachi',
        unidad_agencia: 'Iglesia Central',
        semestre_gestion: 'II-2025',
        calificaciones_1_18: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
        preguntas_19_21: {
          p19_puntos_fuertes: 'Gran compromiso y liderazgo',
          p20_areas_mejora: 'Gestión del tiempo',
          p21_comentario_general: 'Recomendado',
        },
      });

      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(99);
      expect(resultado.puntaje).toBe(20);
    });

    it('debe procesar receptor socioeconómica calculando puntaje sobre 20 y semáforo', async () => {
      periodo_repo.findOne.mockResolvedValue({ id: 1, estado: EstadoPeriodo.ACTIVO });
      modulo_repo.find.mockResolvedValue([{ id: 5, clave_sistema: 'evaluacion_socioeconomica' }]);
      evaluador_repo.find.mockResolvedValue([{ id: 2, nombre: 'Trabajador Social' }]);
      evaluacion_repo.findOne.mockResolvedValue(null);
      evaluacion_repo.save.mockImplementation((d: any) => Promise.resolve({ ...d, id: 101 }));

      const respuestas: Record<number, any> = {};
      for (let i = 1; i <= 26; i++) {
        respuestas[i] = 1;
      }

      const resultado = await servicio.procesarReceptorSocioeconomica({
        becario_id: 1,
        periodo: 'II-2025',
        respuestas_26_preguntas: respuestas,
      });

      expect(resultado).toBeDefined();
      expect(resultado.id).toBe(101);
      expect(resultado.puntaje).toBeDefined();
      expect(resultado.semaforo_socioeconomico).toBe('verde');
    });
  });

  describe('TAREA-02: Evaluación Módulo 3 (Perfil Supervisor o Celular Estudiante con Validación de Identidad)', () => {
    it('debe listar becarios asignados al supervisor con su estado de evaluación del Módulo 3', async () => {
      const supervisor: Usuario = {
        id: 10,
        nombre: 'Angel Ali',
        correo: 'angel.ali@bumand.bo',
        rol: Rol.SUPERVISOR,
      } as any;

      becario_repo.find.mockResolvedValue([
        { id: 1, nombre: 'Juan Perez', carrera: 'Sistemas', universidad: 'UMSA', ci: '1234567', supervisor_id: 10 },
      ]);
      periodo_repo.findOne.mockResolvedValue({ id: 2, estado: EstadoPeriodo.ABIERTO });
      evaluacion_repo.findOne.mockResolvedValue({
        id: 50,
        becario_id: 1,
        modulo_id: 3,
        periodo_id: 2,
        puntaje: 18.5,
        estado: EstadoEvaluacion.COMPLETADO,
        datos_formulario: { modalidad_llenado: 'perfil_supervisor', codigo_verificacion: '654321' },
      });

      const resultado = await servicio.obtenerBecariosAsignadosModulo3(supervisor, 2);

      expect(resultado).toBeDefined();
      expect(resultado.length).toBe(1);
      expect(resultado[0].becario_id).toBe(1);
      expect(resultado[0].evaluado).toBe(true);
      expect(resultado[0].puntaje).toBe(18.5);
      expect(resultado[0].modalidad_llenado).toBe('perfil_supervisor');
    });

    it('debe obtener la evaluación previa del Módulo 3 de un becario para precargar respuestas', async () => {
      periodo_repo.findOne.mockResolvedValue({ id: 2, estado: EstadoPeriodo.ABIERTO });
      evaluacion_repo.findOne.mockResolvedValue({
        id: 50,
        becario_id: 1,
        modulo_id: 3,
        periodo_id: 2,
        puntaje: 19.0,
        datos_formulario: { calificaciones_1_18: [10, 9], modalidad_llenado: 'celular_estudiante' },
      });

      const res = await servicio.obtenerEvaluacionModulo3Becario(1, 2);

      expect(res.evaluado).toBe(true);
      expect(res.datos_formulario).toBeDefined();
      expect(res.modalidad_llenado).toBe('celular_estudiante');
    });

    it('debe procesar receptor mentor registrando modalidad_llenado y codigo_verificacion', async () => {
      periodo_repo.findOne.mockResolvedValue({ id: 2, estado: EstadoPeriodo.ABIERTO });
      evaluador_repo.findOne.mockResolvedValue({ id: 5, nombre: 'Angel Ali', tipo: 'supervisor' });
      evaluacion_repo.findOne.mockResolvedValue(null);
      evaluacion_repo.create.mockImplementation((d: any) => ({ ...d, id: 75 }));
      evaluacion_repo.save.mockImplementation((d: any) => Promise.resolve({ ...d, id: 75 }));

      const supervisor: Usuario = {
        id: 10,
        nombre: 'Angel Ali',
        correo: 'angel.ali@bumand.bo',
        rol: Rol.SUPERVISOR,
      } as any;

      const res = await servicio.procesarReceptorMentorQr(
        {
          becario_id: 1,
          periodo_id: 2,
          modalidad_llenado: 'perfil_supervisor',
          codigo_verificacion: '123456',
          calificaciones_1_18: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
          puntaje_19: 3.33,
          puntaje_20: 3.33,
          puntaje_21: 3.34,
        },
        supervisor,
      );

      expect(res).toBeDefined();
      expect(res.puntaje).toBe(20);
      expect((res.datos_formulario as any).modalidad_llenado).toBe('perfil_supervisor');
      expect((res.datos_formulario as any).codigo_verificacion).toBe('123456');
    });
  });

  describe('TAREA-13: Subida y Revisión Directa de Documentos Académicos', () => {
    it('debe subir récord académico colocando la evaluación en EN_REVISION_ADMINISTRACION', async () => {
      const becario_user: Usuario = { id: 7, nombre: 'Estudiante', rol: Rol.BECARIO } as any;
      becario_repo.findOne.mockResolvedValue({ id: 1, usuario_id: 7 });
      evaluador_repo.findOne.mockResolvedValue({ id: 1 });
      evaluacion_repo.findOne.mockResolvedValue(null);
      evaluacion_repo.create.mockImplementation((d: any) => ({ ...d, id: 80 }));
      evaluacion_repo.save.mockImplementation((d: any) => Promise.resolve({ ...d, id: 80 }));

      const resultado = await servicio.subirDocumentoAcademico(
        {
          periodo_id: 2,
          tipo_documento: 'record_academico',
        },
        { filename: 'record-123.pdf', originalname: 'Record_2026.pdf', size: 2048 },
        becario_user,
      );

      expect(resultado).toBeDefined();
      expect(resultado.estado).toBe(EstadoEvaluacion.EN_REVISION_ADMINISTRACION);
      expect(resultado.archivo_record_academico).toBe('/uploads/academicos/record-123.pdf');
      expect((resultado as any).record_academico).toBe('/uploads/academicos/record-123.pdf');
    });

    it('debe incluir EN_REVISION_ADMINISTRACION en pendientes de administración', async () => {
      const mockQueryBuilder: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 80,
            modulo_id: 2,
            estado: EstadoEvaluacion.EN_REVISION_ADMINISTRACION,
            archivo_record_academico: '/uploads/academicos/rec.pdf',
            archivo_historial_academico: null,
          },
        ]),
      };
      evaluacion_repo.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const lista = await servicio.obtenerPendientesAdministracion(2);

      expect(lista.length).toBe(1);
      expect(lista[0].estado).toBe(EstadoEvaluacion.EN_REVISION_ADMINISTRACION);
      expect((lista[0] as any).record_academico).toBe('/uploads/academicos/rec.pdf');
    });
  });

  describe('TAREA-12: Escuela de Líderes CETI (Módulo 4) - Patrón Classroom', () => {
    it('debe listar las 12 tareas CETI y resumen para un becario', async () => {
      const becario_user: Usuario = { id: 7, nombre: 'Estudiante', rol: Rol.BECARIO } as any;
      becario_repo.findOne.mockResolvedValue({ id: 1, usuario_id: 7 });
      periodo_repo.findOne.mockResolvedValue({ id: 2, estado: EstadoPeriodo.ABIERTO });
      entrega_tarea_repo.find.mockResolvedValue([
        {
          id: 10,
          tarea_numero: 1,
          estado: EstadoEntregaTarea.REVISADO,
          puntaje_obtenido: 8.33,
        },
      ]);

      const resultado = await servicio.obtenerTareasEscuelaLideres(becario_user, 1, 2);

      expect(resultado.tareas.length).toBe(12);
      expect(resultado.resumen.total_tareas).toBe(12);
      expect(resultado.resumen.revisadas).toBe(1);
      expect(resultado.resumen.puntaje_acumulado_100).toBe(8.33);
      expect(resultado.tareas[0].estado).toBe(EstadoEntregaTarea.REVISADO);
      expect(resultado.tareas[1].estado).toBe(EstadoEntregaTarea.PENDIENTE);
    });

    it('debe entregar una tarea CETI registrando archivo de evidencia', async () => {
      const becario_user: Usuario = { id: 7, nombre: 'Estudiante', rol: Rol.BECARIO } as any;
      becario_repo.findOne.mockResolvedValue({ id: 1, usuario_id: 7 });
      entrega_tarea_repo.findOne.mockResolvedValue(null);
      entrega_tarea_repo.create.mockImplementation((d: any) => ({ ...d, id: 15 }));
      entrega_tarea_repo.save.mockImplementation((d: any) => Promise.resolve({ ...d, id: 15 }));

      const entrega = await servicio.entregarTareaEscuelaLideres(
        {
          periodo_id: 2,
          tarea_numero: 2,
          archivo_evidencia_url: '/uploads/escuela-lideres/tarea2.pdf',
          nombre_archivo: 'Tarea2.pdf',
          comentario_becario: 'Entrega puntual',
        },
        becario_user,
      );

      expect(entrega).toBeDefined();
      expect(entrega.estado).toBe(EstadoEntregaTarea.ENTREGADO);
      expect(entrega.archivo_evidencia_url).toBe('/uploads/escuela-lideres/tarea2.pdf');
    });

    it('debe revisar una entrega y recalcular automáticamente la nota del Módulo 4', async () => {
      const facilitador: Usuario = { id: 20, nombre: 'Facilitador CETI', rol: Rol.SUPERVISOR } as any;
      const mock_entrega = {
        id: 15,
        becario_id: 1,
        periodo_id: 2,
        tarea_numero: 1,
        ponderacion_maxima: 8.33,
        estado: EstadoEntregaTarea.ENTREGADO,
        puntaje_obtenido: null,
      };

      entrega_tarea_repo.findOne.mockResolvedValue(mock_entrega);
      entrega_tarea_repo.save.mockImplementation((d: any) => Promise.resolve({ ...d }));
      entrega_tarea_repo.find.mockResolvedValue([
        { ...mock_entrega, estado: EstadoEntregaTarea.REVISADO, puntaje_obtenido: 8.33 },
      ]);
      evaluador_repo.findOne.mockResolvedValue({ id: 4, tipo: 'facilitador' });
      evaluacion_repo.findOne.mockResolvedValue(null);
      evaluacion_repo.create.mockImplementation((d: any) => ({ ...d, id: 95 }));
      evaluacion_repo.save.mockImplementation((d: any) => Promise.resolve({ ...d, id: 95 }));

      const resultado = await servicio.revisarEntregaEscuelaLideres(
        15,
        {
          estado: EstadoEntregaTarea.REVISADO,
          puntaje_obtenido: 8.33,
          comentario_revisor: 'Excelente análisis bíblico',
        },
        facilitador,
      );

      expect(resultado.entrega.estado).toBe(EstadoEntregaTarea.REVISADO);
      expect(resultado.entrega.puntaje_obtenido).toBe(8.33);
      expect(resultado.evaluacion_modulo_4).toBeDefined();
      expect(resultado.evaluacion_modulo_4.modulo_id).toBe(4);
      expect(resultado.evaluacion_modulo_4.puntaje).toBe(8.33);
      expect(resultado.evaluacion_modulo_4.estado).toBe(EstadoEvaluacion.COMPLETADO);
    });
  });
});
