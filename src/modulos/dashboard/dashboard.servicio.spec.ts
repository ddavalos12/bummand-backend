import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardServicio } from './dashboard.servicio';
import { RegistroAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';
import { SolicitudPasajes, EstadoSolicitud } from '../pasajes/entidades/solicitud-pasaje.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Evaluacion } from '../evaluaciones/entidades/evaluacion.entidad';

describe('DashboardServicio', () => {
  let servicio: DashboardServicio;
  let asistencia_repo: any;
  let pasajes_repo: any;
  let becario_repo: any;
  let evaluacion_repo: any;

  beforeEach(async () => {
    const qb_mock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    asistencia_repo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb_mock),
    };
    pasajes_repo = {
      find: jest.fn(),
    };
    becario_repo = {
      find: jest.fn(),
    };
    evaluacion_repo = {
      count: jest.fn(),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardServicio,
        { provide: getRepositoryToken(RegistroAsistencia), useValue: asistencia_repo },
        { provide: getRepositoryToken(SolicitudPasajes), useValue: pasajes_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
        { provide: getRepositoryToken(Evaluacion), useValue: evaluacion_repo },
      ],
    }).compile();

    servicio = modulo.get<DashboardServicio>(DashboardServicio);
  });

  describe('Consolidación analítica del Dashboard', () => {
    it('debe consolidar horas acumuladas, presupuesto del 80% y ranking de puntualidad', async () => {
      // 1. Datos simulados de Becarios
      becario_repo.find.mockResolvedValue([
        { id: 1, carrera: 'Medicina', usuario: { nombre: 'Edgar Alarcon' } },
        { id: 2, carrera: 'Parvularia', usuario: { nombre: 'Nilda Churata' } },
      ]);

      // 2. Datos simulados de Asistencia
      asistencia_repo.find.mockResolvedValue([
        {
          becario_id: 1,
          horas_trabajadas: 4.5,
          fecha: new Date('2026-03-10'),
          dentro_de_horario: true,
          dentro_de_radio: true,
        },
        {
          becario_id: 1,
          horas_trabajadas: 5.0,
          fecha: new Date('2026-03-11'),
          dentro_de_horario: true,
          dentro_de_radio: true,
        },
        {
          becario_id: 2,
          horas_trabajadas: 4.0,
          fecha: new Date('2026-03-10'),
          dentro_de_horario: false, // Llegó tarde
          dentro_de_radio: true,
        },
        {
          becario_id: 2,
          horas_trabajadas: 4.0,
          fecha: new Date('2026-03-12'),
          dentro_de_horario: true,
          dentro_de_radio: true,
        },
      ]);

      // 3. Datos simulados de Solicitudes de Pasajes
      pasajes_repo.find.mockResolvedValue([
        {
          id: 1,
          monto_total: 100.0,
          monto_devolucion: 80.0,
          estado: EstadoSolicitud.APROBADO,
        },
        {
          id: 2,
          monto_total: 50.0,
          monto_devolucion: 40.0,
          estado: EstadoSolicitud.PENDIENTE,
        },
      ]);

      // 4. Evaluaciones pendientes
      evaluacion_repo.count.mockResolvedValue(3);

      const resultado = await servicio.obtenerEstadisticas();

      // Validación de KPIs
      expect(resultado.metricas_generales.total_becarios_activos).toBe(2);
      expect(resultado.metricas_generales.total_horas_acumuladas).toBe(17.5);
      expect(resultado.metricas_generales.promedio_horas_por_becario).toBe(8.75);
      expect(resultado.metricas_generales.evaluaciones_pendientes).toBe(3);
      expect(resultado.metricas_generales.solicitudes_pasajes_pendientes).toBe(1);

      // Validación de Presupuesto del 80%
      expect(resultado.presupuesto_80.total_declarado).toBe(150.0);
      expect(resultado.presupuesto_80.total_reembolso_80).toBe(120.0);
      expect(resultado.presupuesto_80.monto_aprobado).toBe(80.0);
      expect(resultado.presupuesto_80.monto_pendiente).toBe(40.0);
      expect(resultado.presupuesto_80.porcentaje_consumido).toBe(1.2); // (120 / 10000) * 100 = 1.2%

      // Validación de Ranking de Puntualidad
      expect(resultado.ranking_puntualidad.length).toBe(2);
      // Edgar Alarcón tiene 2 de 2 a tiempo (100%), Nilda tiene 1 de 2 a tiempo (50%)
      expect(resultado.ranking_puntualidad[0].nombre).toBe('Edgar Alarcon');
      expect(resultado.ranking_puntualidad[0].puesto).toBe(1);
      expect(resultado.ranking_puntualidad[0].porcentaje_puntualidad).toBe(100.0);

      expect(resultado.ranking_puntualidad[1].nombre).toBe('Nilda Churata');
      expect(resultado.ranking_puntualidad[1].puesto).toBe(2);
      expect(resultado.ranking_puntualidad[1].porcentaje_puntualidad).toBe(50.0);

      // Validación de Tendencia Mensual (Marzo debe tener 17.5 horas)
      const marzo = resultado.tendencia_horas.find((t) => t.mes === 'Mar');
      expect(marzo?.horas).toBe(17.5);
    });
  });

  describe('Seguimiento Semanal (becarios_con_retraso y asistencia_semanal)', () => {
    it('debe devolver becarios con retraso, clasificar asistieron/no asistieron y conteos correctos', async () => {
      becario_repo.find.mockResolvedValue([
        { id: 1, carrera: 'Informática', usuario: { nombre: 'Daniel Dávalos' } },
        { id: 2, carrera: 'Economía', usuario: { nombre: 'Mario Catunta' } },
        { id: 3, carrera: 'Derecho', usuario: { nombre: 'Ana Gómez' } },
      ]);

      const asistencias_mock = [
        {
          becario_id: 1,
          hora_ingreso: '08:00',
          hora_prevista: '08:00',
          minutos_retraso: 0,
          dentro_de_horario: true,
          fecha: new Date('2026-10-12'),
        },
        {
          becario_id: 2,
          hora_ingreso: '08:25',
          hora_prevista: '08:00',
          minutos_retraso: 25,
          dentro_de_horario: false,
          fecha: new Date('2026-10-12'),
        },
      ];

      const qb_mock = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(asistencias_mock),
      };
      asistencia_repo.createQueryBuilder.mockReturnValue(qb_mock);

      const resultado = await servicio.obtenerSeguimientoSemanal(undefined, '2026-10-12');

      // Validar becarios con retraso
      expect(resultado.becarios_con_retraso.length).toBe(1);
      expect(resultado.becarios_con_retraso[0].becario.nombre).toBe('Mario Catunta');
      expect(resultado.becarios_con_retraso[0].hora_ingreso).toBe('08:25');
      expect(resultado.becarios_con_retraso[0].hora_prevista).toBe('08:00');
      expect(resultado.becarios_con_retraso[0].minutos_retraso).toBe(25);

      // Validar clasificación semanal
      expect(resultado.asistencia_semanal.asistieron.length).toBe(2);
      expect(resultado.asistencia_semanal.no_asistieron.length).toBe(1);
      expect(resultado.asistencia_semanal.no_asistieron[0].becario.nombre).toBe('Ana Gómez');

      // Validar conteos
      expect(resultado.conteo.total).toBe(3);
      expect(resultado.conteo.asistieron).toBe(2);
      expect(resultado.conteo.no_asistieron).toBe(1);
    });
  });
});
