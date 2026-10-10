import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventosServicio } from './eventos.servicio';
import { Evento, TipoEvento, EstadoEvento } from './entidades/evento.entidad';
import { AsistenciaEvento, EstadoAsistenciaEvento } from './entidades/asistencia-evento.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';

describe('EventosServicio', () => {
  let servicio: EventosServicio;
  let evento_repo: any;
  let asistencia_repo: any;
  let becario_repo: any;

  beforeEach(async () => {
    evento_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos, id: datos.id || 1 })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    asistencia_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 10 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos, id: datos.id || 10 })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    becario_repo = {
      findOne: jest.fn(),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        EventosServicio,
        { provide: getRepositoryToken(Evento), useValue: evento_repo },
        { provide: getRepositoryToken(AsistenciaEvento), useValue: asistencia_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
      ],
    }).compile();

    servicio = modulo.get<EventosServicio>(EventosServicio);
  });

  describe('Convocatoria y consulta de eventos', () => {
    it('debe crear un evento con radio perimetral y estado programado por defecto', async () => {
      const dto = {
        titulo: 'Taller de Liderazgo',
        descripcion: 'Formación diaconal',
        tipo_evento: TipoEvento.TALLER,
        fecha: '2026-10-25',
        hora_inicio: '08:30',
        hora_fin: '12:30',
        latitud: -16.500054,
        longitud: -68.173455,
        direccion_referencia: 'Oficina Central Diaconía IFD',
      };

      const resultado = await servicio.crear(dto, 2);

      expect(evento_repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Taller de Liderazgo',
          creador_id: 2,
          radio_tolerancia_m: 100,
          estado: EstadoEvento.PROGRAMADO,
        }),
      );
      expect(resultado.id).toBe(1);
    });

    it('debe obtener un evento por ID o lanzar NotFoundException si no existe', async () => {
      evento_repo.findOne.mockResolvedValue(null);
      await expect(servicio.obtenerPorId(999)).rejects.toThrow(NotFoundException);

      evento_repo.findOne.mockResolvedValue({ id: 1, titulo: 'Encuentro General' });
      const encontrado = await servicio.obtenerPorId(1);
      expect(encontrado.titulo).toBe('Encuentro General');
    });
  });

  describe('Marcación geodésica de asistencia con radio de tolerancia', () => {
    const evento_base = {
      id: 1,
      titulo: 'Encuentro de Liderazgo',
      latitud: -16.500054,
      longitud: -68.173455,
      radio_tolerancia_m: 100,
      estado: EstadoEvento.PROGRAMADO,
    };

    const becario_base = {
      id: 5,
      usuario_id: 20,
    };

    it('debe registrar asistencia como "presente" y "dentro_de_radio: true" si está dentro del perímetro', async () => {
      evento_repo.findOne.mockResolvedValue(evento_base);
      becario_repo.findOne.mockResolvedValue(becario_base);
      asistencia_repo.findOne.mockResolvedValue(null); // Sin marcación previa

      // Coordenadas muy cercanas (a aprox 10 metros del epicentro)
      const resultado = await servicio.marcarAsistencia(
        1,
        {
          latitud: -16.500100,
          longitud: -68.173500,
          observaciones: 'Llegada a tiempo',
        },
        20,
      );

      expect(resultado.dentro_de_radio).toBe(true);
      expect(resultado.estado).toBe(EstadoAsistenciaEvento.PRESENTE);
      expect(asistencia_repo.save).toHaveBeenCalled();
    });

    it('debe registrar asistencia como "fuera_de_radio" y "dentro_de_radio: false" si supera la geocerca', async () => {
      evento_repo.findOne.mockResolvedValue(evento_base);
      becario_repo.findOne.mockResolvedValue(becario_base);
      asistencia_repo.findOne.mockResolvedValue(null);

      // Coordenadas a más de 2 kilómetros (ej. Plaza San Pedro, La Paz)
      const resultado = await servicio.marcarAsistencia(
        1,
        {
          latitud: -16.502000,
          longitud: -68.138000,
        },
        20,
      );

      expect(resultado.dentro_de_radio).toBe(false);
      expect(resultado.estado).toBe(EstadoAsistenciaEvento.FUERA_DE_RADIO);
      expect(resultado.distancia_m).toBeGreaterThan(100);
    });

    it('debe lanzar ConflictException si el becario ya registró asistencia previa en el evento', async () => {
      evento_repo.findOne.mockResolvedValue(evento_base);
      becario_repo.findOne.mockResolvedValue(becario_base);
      asistencia_repo.findOne.mockResolvedValue({ id: 99, evento_id: 1, becario_id: 5 });

      await expect(
        servicio.marcarAsistencia(
          1,
          { latitud: -16.500054, longitud: -68.173455 },
          20,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si el evento está cancelado', async () => {
      evento_repo.findOne.mockResolvedValue({
        ...evento_base,
        estado: EstadoEvento.CANCELADO,
      });

      await expect(
        servicio.marcarAsistencia(
          1,
          { latitud: -16.500054, longitud: -68.173455 },
          20,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
