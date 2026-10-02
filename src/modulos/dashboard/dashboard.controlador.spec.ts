import { Test, TestingModule } from '@nestjs/testing';
import { DashboardControlador } from './dashboard.controlador';
import { DashboardServicio } from './dashboard.servicio';

describe('DashboardControlador', () => {
  let controlador: DashboardControlador;
  let servicio: any;

  beforeEach(async () => {
    servicio = {
      obtenerEstadisticas: jest.fn().mockResolvedValue({
        metricas_generales: {
          total_becarios_activos: 10,
          total_horas_acumuladas: 500,
          promedio_horas_por_becario: 50,
          evaluaciones_pendientes: 2,
          solicitudes_pasajes_pendientes: 1,
        },
        presupuesto_80: {
          total_declarado: 1000,
          total_reembolso_80: 800,
          limite_mensual_institucional: 10000,
          porcentaje_consumido: 8.0,
          monto_aprobado: 500,
          monto_pendiente: 300,
        },
        tendencia_horas: [],
        ranking_puntualidad: [],
      }),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [DashboardControlador],
      providers: [
        { provide: DashboardServicio, useValue: servicio },
      ],
    }).compile();

    controlador = modulo.get<DashboardControlador>(DashboardControlador);
  });

  it('debe estar definido', () => {
    expect(controlador).toBeDefined();
  });

  it('debe devolver las estadísticas analíticas consolidadas', async () => {
    const resultado = await controlador.obtenerEstadisticas();
    expect(resultado.metricas_generales.total_becarios_activos).toBe(10);
    expect(resultado.presupuesto_80.total_reembolso_80).toBe(800);
    expect(servicio.obtenerEstadisticas).toHaveBeenCalled();
  });
});
