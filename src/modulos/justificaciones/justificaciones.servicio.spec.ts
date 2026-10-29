import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JustificacionesServicio } from './justificaciones.servicio';
import {
  Justificacion,
  TipoIncidencia,
  EstadoJustificacion,
} from './entidades/justificacion.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { AsistenciaEvento, EstadoAsistenciaEvento } from '../eventos/entidades/asistencia-evento.entidad';
import { Multa } from '../asistencia/entidades/multa.entidad';
import { RegistroAsistencia } from '../asistencia/entidades/registro-asistencia.entidad';

describe('JustificacionesServicio', () => {
  let servicio: JustificacionesServicio;
  let justificacion_repo: any;
  let becario_repo: any;
  let asistencia_evento_repo: any;

  beforeEach(async () => {
    justificacion_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos, id: datos.id || 1 })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    becario_repo = {
      findOne: jest.fn(),
    };

    asistencia_evento_repo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((datos) => Promise.resolve(datos)),
    };

    const multa_repo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((datos) => Promise.resolve(datos)),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        JustificacionesServicio,
        { provide: getRepositoryToken(Justificacion), useValue: justificacion_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
        { provide: getRepositoryToken(AsistenciaEvento), useValue: asistencia_evento_repo },
        { provide: getRepositoryToken(Multa), useValue: multa_repo },
        { provide: getRepositoryToken(RegistroAsistencia), useValue: {} },
      ],
    }).compile();

    servicio = modulo.get<JustificacionesServicio>(JustificacionesServicio);
  });

  describe('Envío de justificaciones por becarios', () => {
    it('debe registrar una justificación en estado PENDIENTE asociada al becario', async () => {
      becario_repo.findOne.mockResolvedValue({ id: 7, usuario_id: 15 });

      const dto = {
        tipo_incidencia: TipoIncidencia.ASISTENCIA_PRACTICAS,
        fecha_incidencia: '2026-10-15',
        motivo: 'Cita médica de urgencia',
        descripcion: 'Consulta odontológica con baja certificada.',
      };

      const resultado = await servicio.crear(dto, 15);

      expect(justificacion_repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          becario_id: 7,
          tipo_incidencia: TipoIncidencia.ASISTENCIA_PRACTICAS,
          estado: EstadoJustificacion.PENDIENTE,
        }),
      );
      expect(resultado.id).toBe(1);
    });

    it('debe lanzar NotFoundException si el becario no existe', async () => {
      becario_repo.findOne.mockResolvedValue(null);

      await expect(
        servicio.crear(
          {
            tipo_incidencia: TipoIncidencia.OTRO,
            fecha_incidencia: '2026-10-15',
            motivo: 'Motivo de prueba',
            descripcion: 'Descripción',
          },
          99,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Resolución de justificaciones por supervisores', () => {
    const justificacion_pendiente = {
      id: 1,
      becario_id: 7,
      tipo_incidencia: TipoIncidencia.ASISTENCIA_EVENTO,
      referencia_id: 42,
      estado: EstadoJustificacion.PENDIENTE,
    };

    it('debe aprobar una justificación con observación fundamentada y actualizar asistencia si aplica', async () => {
      justificacion_repo.findOne.mockResolvedValue({ ...justificacion_pendiente });
      asistencia_evento_repo.findOne.mockResolvedValue({
        id: 42,
        estado: EstadoAsistenciaEvento.AUSENTE,
        observaciones: null,
      });

      const resuelta = await servicio.resolver(
        1,
        {
          estado: EstadoJustificacion.APROBADA,
          observacion_supervisor: 'Certificado de salud contrastado y validado.',
        },
        2, // ID de supervisor
      );

      expect(resuelta.estado).toBe(EstadoJustificacion.APROBADA);
      expect(resuelta.supervisor_id).toBe(2);
      expect(resuelta.observacion_supervisor).toBe('Certificado de salud contrastado y validado.');
      expect(resuelta.fecha_resolucion).toBeInstanceOf(Date);
      expect(asistencia_evento_repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          estado: EstadoAsistenciaEvento.JUSTIFICADO,
        }),
      );
    });

    it('debe rechazar una justificación si el supervisor la dictamina con observación fundamentada', async () => {
      justificacion_repo.findOne.mockResolvedValue({ ...justificacion_pendiente });

      const resuelta = await servicio.resolver(
        1,
        {
          estado: EstadoJustificacion.RECHAZADA,
          observacion_supervisor: 'No se adjuntó comprobante ni respaldo válido.',
        },
        2,
      );

      expect(resuelta.estado).toBe(EstadoJustificacion.RECHAZADA);
      expect(resuelta.supervisor_id).toBe(2);
    });

    it('debe lanzar BadRequestException si falta la fundamentación u observación obligatoria', async () => {
      justificacion_repo.findOne.mockResolvedValue({ ...justificacion_pendiente });

      await expect(
        servicio.resolver(
          1,
          {
            estado: EstadoJustificacion.RECHAZADA,
            observacion_supervisor: '   ',
          },
          2,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe permitir la revisión del supervisor en el flujo de 2 pasos', async () => {
      justificacion_repo.findOne.mockResolvedValue({ ...justificacion_pendiente });

      const resuelta = await servicio.revisarSupervisor(
        1,
        {
          estado: EstadoJustificacion.REVISADO_SUPERVISOR,
          observacion_supervisor: 'Visto bueno preliminar de supervisor',
        },
        5,
      );

      expect(resuelta.estado).toBe(EstadoJustificacion.REVISADO_SUPERVISOR);
      expect(resuelta.revisado_por_supervisor_id).toBe(5);
      expect(resuelta.fecha_revision_supervisor).toBeInstanceOf(Date);
      expect(resuelta.observacion_supervisor).toBe('Visto bueno preliminar de supervisor');
    });

    it('debe aprobar por administración y anular automáticamente multas de viernes coincidentes', async () => {
      const fecha_viernes = new Date('2026-10-16T00:00:00.000Z');
      justificacion_repo.findOne.mockResolvedValue({
        ...justificacion_pendiente,
        fecha_incidencia: fecha_viernes,
        becario_id: 7,
      });

      const multa_viernes = {
        id: 99,
        becario_id: 7,
        fecha_aplicacion: fecha_viernes,
        monto_bs: 15,
        motivo: 'Retraso de 10 min en Escuela de Líderes',
      };

      (servicio as any).multaRepositorio.find = jest.fn().mockResolvedValue([multa_viernes]);
      (servicio as any).multaRepositorio.save = jest.fn().mockImplementation((m) => Promise.resolve(m));

      const resuelta = await servicio.aprobarAdministracion(
        1,
        {
          observacion_admin: 'Permiso aprobado por administración central',
        },
        1,
      );

      expect(resuelta.estado).toBe(EstadoJustificacion.APROBADO_ADMINISTRACION);
      expect(resuelta.aprobado_por_admin_id).toBe(1);
      expect(resuelta.fecha_aprobacion_admin).toBeInstanceOf(Date);
      expect(multa_viernes.monto_bs).toBe(0);
      expect(multa_viernes.motivo).toContain('Multa eximida/anulada');
    });
  });
});
