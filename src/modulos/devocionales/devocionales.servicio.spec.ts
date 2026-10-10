import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DevocionalesServicio } from './devocionales.servicio';
import { Devocional } from './entidades/devocional.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';

describe('DevocionalesServicio', () => {
  let servicio: DevocionalesServicio;
  let devocional_repo: any;
  let becario_repo: any;

  beforeEach(async () => {
    devocional_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(true),
    };

    becario_repo = {
      findOne: jest.fn().mockResolvedValue({ id: 5, usuario_id: 10 }),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        DevocionalesServicio,
        { provide: getRepositoryToken(Devocional), useValue: devocional_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
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
});
