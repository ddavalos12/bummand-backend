import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PdfServicio } from './pdf.servicio';
import { Evento } from '../eventos/entidades/evento.entidad';
import { AsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';
import { REGISTROS_CONSOLIDADO_SEM_II } from '../evaluaciones/constantes/consolidado-semestral-datos.constantes';

describe('PdfServicio', () => {
  let servicio: PdfServicio;

  beforeEach(async () => {
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
});
