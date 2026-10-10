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

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        JustificacionesServicio,
        { provide: getRepositoryToken(Justificacion), useValue: justificacion_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
        { provide: getRepositoryToken(AsistenciaEvento), useValue: asistencia_evento_repo },
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
  });
});
