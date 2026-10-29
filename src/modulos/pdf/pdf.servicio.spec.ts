import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PdfServicio } from './pdf.servicio';
import { Evento } from '../eventos/entidades/evento.entidad';
import { AsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';
import { Refrigerio } from '../refrigerios/entidades/refrigerio.entidad';
import { REGISTROS_CONSOLIDADO_SEM_II } from '../evaluaciones/constantes/consolidado-semestral-datos.constantes';

describe('PdfServicio', () => {
  let servicio: PdfServicio;
  let refrigerio_repo: any;

  beforeEach(async () => {
    refrigerio_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfServicio,
        {
          provide: getRepositoryToken(Evento),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(AsistenciaEvento),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Refrigerio),
          useValue: refrigerio_repo,
        },
      ],
    }).compile();

    servicio = module.get<PdfServicio>(PdfServicio);
  });

  it('should be defined', () => {
    expect(servicio).toBeDefined();
  });

  describe('generarReporteEvaluacionSemestralHtml', () => {
    it('debe generar HTML completo con 14 columnas, 21 becarios, comentarios y rangos oficiales', () => {
      const html = servicio.generarReporteEvaluacionSemestralHtml();

      // Verificar elementos de estructura y diseño
      expect(html).toContain('size: A4 landscape');
      expect(html).toContain('Consolidado General de Evaluación Semestral');
      expect(html).toContain('Gestión II-2025');

      // Verificar columnas principales
      expect(html).toContain('Acad. (20p)');
      expect(html).toContain('Iglesia (20p)');
      expect(html).toContain('Prácticas (20p)');
      expect(html).toContain('Líderes (20p)');
      expect(html).toContain('Socioec. (20p)');
      expect(html).toContain('Total (100p)');
      expect(html).toContain('Calificación');

      // Verificar inclusión de becarios canónicos
      expect(html).toContain('Jose Marcos Suñagua Quispe');
      expect(html).toContain('Mayherli Alejandra Loza Villalobos');

      // Verificar página 2 de comentarios y rangos
      expect(html).toContain('page-break-before: always');
      expect(html).toContain('Observaciones Cualitativas y Criterios Oficiales de Evaluación');
      expect(html).toContain('Aprobación óptima');
      expect(html).toContain('Aprobación Condicionada');
      expect(html).toContain('Reprobó y debe abandonar el programa');
      expect(html).toContain('70 - 100');
    });

    it('debe generar HTML con registros personalizados si se le suministran', () => {
      const registros_prueba = [
        {
          nombre_completo: 'Test Becario Uno',
          ci: '1234567',
          universidad: 'UMSA',
          carrera: 'Derecho',
          modalidad_carrera: 'Semestral',
          promedio: 85,
          academica: 20,
          liderazgo_iglesia: 20,
          practicas_preprofesionales: 20,
          escuela_lideres: 20,
          ceti_tareas: [100],
          socioeconomico: 20,
          total: 100,
          total_calificacion: 'Aprobación óptima',
          tipo_beca: 'Total',
          comentario_academico: 'Excelente rendimiento',
          comentario_iglesia: 'Líder comprometido',
        },
      ];

      const html = servicio.generarReporteEvaluacionSemestralHtml(registros_prueba);
      expect(html).toContain('Test Becario Uno');
      expect(html).toContain('Excelente rendimiento');
      expect(html).toContain('Líder comprometido');
    });
  });

  describe('parsearMes', () => {
    it('debe parsear formato YYYY-MM correctamente', () => {
      const res = servicio.parsearMes('2026-10');
      expect(res.anio).toBe(2026);
      expect(res.mes_num).toBe(10);
      expect(res.fecha_inicio).toBe('2026-10-01');
      expect(res.fecha_fin).toBe('2026-10-31');
      expect(res.mes_nombre).toBe('Octubre 2026');
    });

    it('debe parsear nombre de mes en español', () => {
      const res = servicio.parsearMes('Septiembre 2026');
      expect(res.anio).toBe(2026);
      expect(res.mes_num).toBe(9);
      expect(res.fecha_inicio).toBe('2026-09-01');
      expect(res.fecha_fin).toBe('2026-09-30');
      expect(res.mes_nombre).toBe('Septiembre 2026');
    });
  });

  describe('generarExpedienteRecorridosEstudianteHtml', () => {
    it('debe generar HTML completo del expediente mensual de recorridos con cálculo exacto del 80% y firmas', () => {
      const html = servicio.generarExpedienteRecorridosEstudianteHtml({
        nombre_estudiante: 'Carlos Oscar Luna Lizarraga',
        ci_estudiante: '9943280 LP',
        carrera_estudiante: 'Economía',
        universidad_estudiante: 'UMSA',
        sede_estudiante: 'Oficina Central Diaconía',
        supervisor_nombre: 'Lic. Angel Javier Ali Paz',
        mes_nombre: 'Octubre 2026',
        items: [
          {
            numero: 1,
            fecha: '2026-10-02',
            dia_semana: 'Viernes',
            tramo: 'Ida',
            origen: 'Ceja El Alto',
            destino: 'San Francisco',
            calles_declaradas: 'Av. 6 de Marzo, Autopista',
            medio_transporte: 'Minibús Interciudad',
            tipo_actividad: 'Prácticas',
            apoyo_realizado: 'Conciliación de cartera',
            tarifa: 3.5,
          },
        ],
        total_bruto: 3.5,
        total_devolucion: 2.8,
        total_tramos: 1,
        tramos_ida: 1,
        tramos_vuelta: 0,
        dias_unicos: 1,
      });

      expect(html).toContain('Expediente Mensual Oficial de Recorridos y Liquidación de Pasajes (80%)');
      expect(html).toContain('Carlos Oscar Luna Lizarraga');
      expect(html).toContain('9943280 LP');
      expect(html).toContain('Economía');
      expect(html).toContain('Ceja El Alto');
      expect(html).toContain('San Francisco');
      expect(html).toContain('MONTO REEMBOLSO OFICIAL BUMAND (80% EN CENTAVOS)');
      expect(html).toContain('Bs 2.80');
      expect(html).toContain('Revisado / Aprobado en sistema por:');
      expect(html).toContain('Supervisor Institucional');
      expect(html).toContain('Visto Bueno y Liquidación · Fundación Diaconía FRIF-IFD');
      expect(html).not.toContain('Firma del Estudiante Becario');
    });
  });

  describe('generarAsistenciaMensualEstudianteHtml', () => {
    it('debe generar HTML completo del kárdex mensual de asistencia de un solo estudiante', () => {
      const html = servicio.generarAsistenciaMensualEstudianteHtml({
        nombre_estudiante: 'Adai Belen Huayta Cardozo',
        ci_estudiante: '13696496 LP',
        carrera_estudiante: 'Estadística',
        universidad_estudiante: 'UMSA',
        sede_estudiante: 'Sede Central Blq. A',
        supervisor_nombre: 'Lic. Angel Javier Ali Paz',
        mes_nombre: 'Octubre 2026',
        items: [
          {
            numero: 1,
            fecha: '2026-10-02',
            dia_semana: 'Viernes',
            tipo: 'Escuela de Líderes',
            sede: 'Auditorio Central',
            hora_prevista: '14:30',
            hora_ingreso: '14:25',
            hora_salida: '17:00',
            retraso_m: 0,
            horas: 2.5,
            geocerca: 'Conforme (22m GPS)',
            estado: 'Puntual Conforme',
            es_retraso: false,
          },
        ],
        total_dias: 1,
        horas_totales: 2.5,
        meta_horas: 36.0,
        pct_avance: 7,
        asistencias_conformes: 1,
        pct_puntualidad: '100.0',
        total_retrasos: 0,
        minutos_totales_retraso: 0,
        horas_practicas: '0.0',
        horas_lideres: '2.5',
        horas_servicio: '0.0',
      });

      expect(html).toContain('Kárdex Oficial Individual de Asistencia y Puntualidad Mensual');
      expect(html).toContain('Adai Belen Huayta Cardozo');
      expect(html).toContain('13696496 LP');
      expect(html).toContain('Estadística');
      expect(html).toContain('Escuela de Líderes');
      expect(html).toContain('TOTAL HORAS ACREDITADAS EN EL MES');
      expect(html).toContain('Revisado / Aprobado en sistema por:');
      expect(html).toContain('Supervisor Tutor Institucional');
      expect(html).toContain('Auditoría y Certificación de Asistencia · Diaconía IFD');
      expect(html).not.toContain('Firma del Estudiante Becario');
    });
  });

  describe('Reportes PDF de Refrigerios y Auditoría (TAREA-07, TAREA-08, TAREA-15)', () => {
    it('debe generar HTML del reporte de refrigerio con dupla, modalidad, ingredientes y devolución al 100%', () => {
      const refrigerio_mock: Partial<Refrigerio> = {
        id: 10,
        fecha: new Date('2026-10-30'),
        descripcion: 'Sándwich de huevo con jugo de durazno',
        cantidad_raciones: 23,
        costo_unitario_bs: 6.0,
        costo_total_bs: 138.0,
        presupuesto_referencial_bs: 138.0,
        porcentaje_devolucion: 100.0,
        monto_devolucion_bs: 138.0,
        modalidad_preparacion: 'cocina_diaconia',
        becario_encargado_1_id: 1,
        becario_encargado_1_nombre: 'Nilda Churata',
        becario_encargado_2_id: 2,
        becario_encargado_2_nombre: 'Joel Mamani',
        becario_receptor_devolucion_id: 1,
        becario_receptor_devolucion_nombre: 'Nilda Churata',
        fecha_entrega_devolucion: new Date('2026-10-30T16:00:00Z'),
        entregado_por_usuario_id: 99,
        estado_reposicion: 'aprobado_administracion',
        detalle_ingredientes: [
          { insumo: 'Pan surtido', cantidad: '25 unid', costo_bs: 38.0, pagado_por_nombre: 'Nilda Churata' },
          { insumo: 'Huevos y refresco', cantidad: '1 maple', costo_bs: 100.0, pagado_por_nombre: 'Joel Mamani' },
        ],
      };

      const html = servicio.generarReporteRefrigerioHtml(refrigerio_mock as Refrigerio);

      expect(html).toContain('Planilla Oficial de Rendición de Refrigerios y Solicitud de Devolución (100%)');
      expect(html).toContain('REP-REF-00010');
      expect(html).toContain('Nilda Churata');
      expect(html).toContain('Joel Mamani');
      expect(html).toContain('Preparado en Cocina de Diaconía');
      expect(html).toContain('Pan surtido');
      expect(html).toContain('Bs 138.00');
      expect(html).toContain('100.00% (Reembolso Total)');
      expect(html).toContain('Nilda Churata');
      expect(html).toContain('De acuerdo con la directriz del Directorio de BUMAND');
    });

    it('debe generar HTML del consolidado de refrigerios por intervalo de auditoría', () => {
      const refrigerios = [
        {
          id: 1,
          fecha: new Date('2026-10-02'),
          descripcion: 'Refrigerio 1',
          cantidad_raciones: 23,
          costo_total_bs: 138.0,
          monto_devolucion_bs: 138.0,
          becario_encargado_1_nombre: 'Nilda Churata',
          becario_encargado_2_nombre: 'Joel Mamani',
          becario_receptor_devolucion_nombre: 'Nilda Churata',
          estado_reposicion: 'aprobado_administracion',
        } as Refrigerio,
      ];

      const html = servicio.generarReporteRefrigeriosConsolidadoHtml({
        refrigerios,
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
      });

      expect(html).toContain('Consolidado de Auditoría de Refrigerios y Devoluciones al 100%');
      expect(html).toContain('2026-10-01');
      expect(html).toContain('2026-10-31');
      expect(html).toContain('Nilda Churata');
      expect(html).toContain('Joel Mamani');
    });

    it('debe generar HTML del consolidado global de auditoría', () => {
      const html = servicio.generarConsolidadoAuditoriaHtml({
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
        total_asistencias: 50,
        total_horas: 180.5,
        total_solicitudes_pasajes: 20,
        total_monto_pasajes: 560.0,
        total_refrigerios: 4,
        total_monto_refrigerios: 552.0,
      });

      expect(html).toContain('Informe Oficial Consolidado de Auditoría y Fiscalización Institucional');
      expect(html).toContain('Auditoría de Asistencia y Acreditación de Horas');
      expect(html).toContain('Auditoría de Liquidación de Pasajes (80%)');
      expect(html).toContain('Auditoría de Refrigerios y Devolución Total (100%)');
      expect(html).toContain('Bs 552.00');
    });
  });

  describe('generación binaria con Puppeteer', () => {
    it('debe generar el buffer PDF válido del expediente de recorridos mensual', async () => {
      const resultado = await servicio.generarExpedienteRecorridosEstudiantePdf({
        becario_id: 7,
        mes: '2026-10',
      });

      expect(resultado).toBeDefined();
      expect(resultado.bufer).toBeInstanceOf(Buffer);
      expect(resultado.bufer.length).toBeGreaterThan(0);
      expect(resultado.nombre_archivo).toContain('Expediente_Recorridos_');
      expect(resultado.mes_nombre).toBe('Octubre 2026');
    });

    it('debe generar el buffer PDF válido del kárdex de asistencia mensual', async () => {
      const resultado = await servicio.generarAsistenciaMensualEstudiantePdf({
        becario_id: 1,
        mes: '2026-10',
      });

      expect(resultado).toBeDefined();
      expect(resultado.bufer).toBeInstanceOf(Buffer);
      expect(resultado.bufer.length).toBeGreaterThan(0);
      expect(resultado.nombre_archivo).toContain('Asistencia_Mensual_');
      expect(resultado.mes_nombre).toBe('Octubre 2026');
    });

    it('debe generar el buffer PDF válido del reporte de refrigerio (TAREA-07)', async () => {
      refrigerio_repo.findOne.mockResolvedValue({
        id: 12,
        fecha: new Date('2026-10-30'),
        descripcion: 'Refrigerio jornada Escuela de Líderes',
        cantidad_raciones: 23,
        costo_unitario_bs: 6.0,
        costo_total_bs: 138.0,
        presupuesto_referencial_bs: 138.0,
        porcentaje_devolucion: 100.0,
        monto_devolucion_bs: 138.0,
        modalidad_preparacion: 'cocina_diaconia',
        becario_encargado_1_id: 1,
        becario_encargado_1_nombre: 'Nilda Churata',
        becario_encargado_2_id: 2,
        becario_encargado_2_nombre: 'Joel Mamani',
        becario_receptor_devolucion_id: 1,
        becario_receptor_devolucion_nombre: 'Nilda Churata',
        estado_reposicion: 'aprobado_administracion',
        detalle_ingredientes: [],
      });

      const resultado = await servicio.generarReporteRefrigerioPdf(12);

      expect(resultado).toBeDefined();
      expect(resultado.bufer).toBeInstanceOf(Buffer);
      expect(resultado.bufer.length).toBeGreaterThan(0);
      expect(resultado.nombre_archivo).toContain('Reporte_Refrigerio_12_');
    });
  });
});
