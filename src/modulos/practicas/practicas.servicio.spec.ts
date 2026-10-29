import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PracticasServicio } from './practicas.servicio';
import { AprobacionPracticas, EstadoAprobacionPracticas } from './entidades/aprobacion-practicas.entidad';

describe('PracticasServicio', () => {
  let servicio: PracticasServicio;
  let repo: any;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: d.id || 1 })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PracticasServicio,
        { provide: getRepositoryToken(AprobacionPracticas), useValue: repo },
      ],
    }).compile();

    servicio = modulo.get<PracticasServicio>(PracticasServicio);
  });

  it('debe crear una certificación de prácticas en estado REVISADO_SUPERVISOR', async () => {
    const dto = {
      becario_id: 1,
      periodo: 'Agosto 2026',
      horas_aprobadas: 36,
      observaciones: 'Horas cumplidas con excelencia',
    };

    const resultado = await servicio.crear(dto, 2);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        becario_id: 1,
        periodo: 'Agosto 2026',
        horas_aprobadas: 36,
      }),
    );
    expect(resultado.id).toBe(1);
  });

  it('debe lanzar NotFoundException si no encuentra la aprobación', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(servicio.obtenerPorId(99)).rejects.toThrow(NotFoundException);
  });

  describe('Flujo de 2 Pasos en Prácticas (Supervisor y Administración)', () => {
    it('debe registrar la revisión del supervisor', async () => {
      const aprobacion_existente = {
        id: 1,
        becario_id: 1,
        periodo: 'Agosto 2026',
        horas_aprobadas: 36,
        estado: EstadoAprobacionPracticas.PENDIENTE,
      };
      repo.findOne.mockResolvedValue(aprobacion_existente);

      const resultado = await servicio.revisarSupervisor(1, {
        estado: EstadoAprobacionPracticas.REVISADO_SUPERVISOR,
        observacion_supervisor: 'Verificado conforme a bitácora',
      }, 5);

      expect(resultado.estado).toBe(EstadoAprobacionPracticas.REVISADO_SUPERVISOR);
      expect(resultado.revisado_por_supervisor_id).toBe(5);
      expect(resultado.fecha_revision_supervisor).toBeInstanceOf(Date);
      expect(resultado.observacion_supervisor).toBe('Verificado conforme a bitácora');
    });

    it('debe registrar la aprobación final de administración', async () => {
      const aprobacion_existente = {
        id: 1,
        becario_id: 1,
        periodo: 'Agosto 2026',
        horas_aprobadas: 36,
        estado: EstadoAprobacionPracticas.REVISADO_SUPERVISOR,
      };
      repo.findOne.mockResolvedValue(aprobacion_existente);

      const resultado = await servicio.aprobarAdministracion(1, {
        estado: EstadoAprobacionPracticas.APROBADO_ADMINISTRACION,
        observacion_admin: 'Validación definitiva de horas para convalidación',
      }, 1);

      expect(resultado.estado).toBe(EstadoAprobacionPracticas.APROBADO_ADMINISTRACION);
      expect(resultado.aprobado_por_admin_id).toBe(1);
      expect(resultado.fecha_aprobacion_admin).toBeInstanceOf(Date);
      expect(resultado.observacion_admin).toBe('Validación definitiva de horas para convalidación');
    });
  });
});
