import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DevocionalesServicio } from './devocionales.servicio';
import { Devocional } from './entidades/devocional.entidad';
import { CitaSeguimiento, EstadoCita, ModalidadCita } from './entidades/cita-seguimiento.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { NotificacionesServicio } from '../notificaciones/notificaciones.servicio';
import { Rol } from '../usuarios/entidades/usuario.entidad';

describe('DevocionalesServicio', () => {
  let servicio: DevocionalesServicio;
  let devocional_repo: any;
  let becario_repo: any;
  let cita_repo: any;
  let notificaciones_servicio: any;

  beforeEach(async () => {
    devocional_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(true),
    };

    becario_repo = {
      findOne: jest.fn().mockResolvedValue({ id: 5, usuario_id: 10, supervisor_id: 2 }),
      find: jest.fn().mockResolvedValue([{ id: 5, usuario_id: 10, supervisor_id: 2 }]),
    };

    cita_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 100 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };

    notificaciones_servicio = {
      crear: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        DevocionalesServicio,
        { provide: getRepositoryToken(Devocional), useValue: devocional_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
        { provide: getRepositoryToken(CitaSeguimiento), useValue: cita_repo },
        { provide: NotificacionesServicio, useValue: notificaciones_servicio },
      ],
    }).compile();

    servicio = modulo.get<DevocionalesServicio>(DevocionalesServicio);
  });

  it('debe registrar un nuevo devocional para un becario', async () => {
    const dto = {
      fecha: '2026-10-08',
      cita_biblica: 'Proverbios 3:5-6',
      titulo: 'Confianza en el Señor',
      reflexion: 'Fíate de Jehová de todo tu corazón y no te apoyes en tu propia prudencia.',
      oracion_peticion: 'Sabiduría en mis estudios y prácticas.',
    };

    const creado = await servicio.crear(dto, 10);
    expect(creado).toBeDefined();
    expect(creado.becario_id).toBe(5);
    expect(creado.cita_biblica).toBe('Proverbios 3:5-6');
    expect(devocional_repo.save).toHaveBeenCalled();
  });

  it('debe retroalimentar pastoralmente un devocional', async () => {
    devocional_repo.findOne.mockResolvedValue({
      id: 1,
      titulo: 'Confianza',
      revisado_por_pastor: false,
    });

    const retroalimentado = await servicio.retroalimentarPastor(1, {
      comentario_pastoral: 'Excelente reflexión mi hermano.',
    });

    expect(retroalimentado.revisado_por_pastor).toBe(true);
    expect(retroalimentado.comentario_pastoral).toBe('Excelente reflexión mi hermano.');
  });

  describe('obtenerMisSupervisados', () => {
    it('debe retornar la lista de becarios supervisados cuando existen', async () => {
      const lista = [{ id: 5, usuario_id: 10, supervisor_id: 2 }];
      becario_repo.find.mockResolvedValueOnce(lista);

      const resultado = await servicio.obtenerMisSupervisados(2);
      expect(resultado).toEqual(lista);
      expect(becario_repo.find).toHaveBeenCalledWith({
        where: { supervisor_id: 2 },
        relations: { usuario: true },
      });
    });

    it('debe retornar todos los becarios si no hay supervisados asignados en entorno demo', async () => {
      becario_repo.find.mockResolvedValueOnce([]); // Primera búsqueda vacía
      const demo_becarios = [{ id: 1, usuario_id: 11 }];
      becario_repo.find.mockResolvedValueOnce(demo_becarios); // Fallback

      const resultado = await servicio.obtenerMisSupervisados(99);
      expect(resultado).toEqual(demo_becarios);
      expect(becario_repo.find).toHaveBeenCalledTimes(2);
    });
  });

  describe('crearCitaSeguimiento', () => {
    it('debe crear una cita de seguimiento y enviar notificación al becario', async () => {
      const dto = {
        becario_id: 5,
        fecha_cita: '2026-11-10',
        hora_cita: '15:30',
        modalidad: ModalidadCita.PRESENCIAL,
        lugar_o_enlace: 'Oficina Pastoral',
        motivo_retroalimentacion: 'Revisión semestral',
        cita_biblica: 'Josué 1:9',
      };

      becario_repo.findOne.mockResolvedValue({ id: 5, usuario_id: 10, supervisor_id: 2 });
      cita_repo.findOne.mockResolvedValue({
        id: 100,
        ...dto,
        supervisor_id: 2,
        estado: EstadoCita.PROGRAMADA,
      });

      const cita = await servicio.crearCitaSeguimiento(2, dto);

      expect(cita).toBeDefined();
      expect(cita_repo.create).toHaveBeenCalled();
      expect(cita_repo.save).toHaveBeenCalled();
      expect(notificaciones_servicio.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: 10,
          tipo: 'cita_seguimiento',
        }),
      );
    });

    it('debe lanzar NotFoundException si el becario no existe', async () => {
      becario_repo.findOne.mockResolvedValue(null);

      await expect(
        servicio.crearCitaSeguimiento(2, {
          becario_id: 999,
          fecha_cita: '2026-11-10',
          hora_cita: '10:00',
          lugar_o_enlace: 'Zoom',
          motivo_retroalimentacion: 'Prueba',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el becario pertenece a otro supervisor', async () => {
      becario_repo.findOne.mockResolvedValue({ id: 5, usuario_id: 10, supervisor_id: 88 });

      await expect(
        servicio.crearCitaSeguimiento(2, {
          becario_id: 5,
          fecha_cita: '2026-11-10',
          hora_cita: '10:00',
          lugar_o_enlace: 'Zoom',
          motivo_retroalimentacion: 'Prueba',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('obtenerCitasSeguimiento', () => {
    it('debe retornar citas filtradas por supervisor_id para rol SUPERVISOR', async () => {
      const citas_mock = [{ id: 1, supervisor_id: 2 }];
      cita_repo.find.mockResolvedValue(citas_mock);

      const resultado = await servicio.obtenerCitasSeguimiento({ id: 2, rol: Rol.SUPERVISOR });

      expect(resultado).toEqual(citas_mock);
      expect(cita_repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { supervisor_id: 2 },
        }),
      );
    });

    it('debe retornar citas filtradas por becario_id para rol BECARIO', async () => {
      becario_repo.findOne.mockResolvedValue({ id: 5, usuario_id: 10 });
      const citas_mock = [{ id: 1, becario_id: 5 }];
      cita_repo.find.mockResolvedValue(citas_mock);

      const resultado = await servicio.obtenerCitasSeguimiento({ id: 10, rol: Rol.BECARIO });

      expect(resultado).toEqual(citas_mock);
      expect(cita_repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { becario_id: 5 },
        }),
      );
    });
  });

  describe('actualizarCitaSeguimiento', () => {
    it('debe actualizar los acuerdos y notificar al becario', async () => {
      const cita_existente = {
        id: 100,
        supervisor_id: 2,
        becario_id: 5,
        estado: EstadoCita.PROGRAMADA,
        becario: { usuario_id: 10 },
      };
      cita_repo.findOne.mockResolvedValue(cita_existente);
      cita_repo.save.mockImplementation((c: any) => Promise.resolve(c));

      const actualizada = await servicio.actualizarCitaSeguimiento(100, 2, {
        estado: EstadoCita.REALIZADA,
        acuerdos_retroalimentacion: 'Compromiso de lectura bíblica diaria.',
      });

      expect(actualizada.estado).toBe(EstadoCita.REALIZADA);
      expect(actualizada.acuerdos_retroalimentacion).toBe('Compromiso de lectura bíblica diaria.');
      expect(notificaciones_servicio.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario_id: 10,
          tipo: 'cita_seguimiento',
        }),
      );
    });

    it('debe lanzar ForbiddenException si otro supervisor intenta actualizarla', async () => {
      cita_repo.findOne.mockResolvedValue({
        id: 100,
        supervisor_id: 99,
      });

      await expect(
        servicio.actualizarCitaSeguimiento(100, 2, {
          estado: EstadoCita.CANCELADA,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar NotFoundException si la cita no existe', async () => {
      cita_repo.findOne.mockResolvedValue(null);

      await expect(
        servicio.actualizarCitaSeguimiento(999, 2, {
          estado: EstadoCita.CANCELADA,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
