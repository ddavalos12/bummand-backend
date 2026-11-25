import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AsistenciaControlador } from './asistencia.controlador';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistrarAsistenciaManualDto } from './dtos/registrar-asistencia-manual.dto';
import { RegistroAsistencia } from './entidades/registro-asistencia.entidad';
import { Multa } from './entidades/multa.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { HorarioApoyo } from '../becarios/entidades/horario-apoyo.entidad';
import { Iglesia } from '../iglesias/entidades/iglesia.entidad';
import { Evento } from '../eventos/entidades/evento.entidad';
import { Justificacion } from '../justificaciones/entidades/justificacion.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { FiltroExcepcionesGlobal } from '../../nucleo/errores';

describe('AsistenciaControlador - Registro Manual', () => {
  let app: INestApplication<App>;
  const asistencia_servicio_mock = {
    registrarAsistenciaManual: jest
      .fn()
      .mockImplementation((dto: RegistrarAsistenciaManualDto) =>
        Promise.resolve({
          id: 99,
          becario_id: dto.becario_id,
          tipo: dto.tipo || 'practicas',
          fecha: dto.fecha,
          hora_ingreso: '08:00:00',
          hora_salida: '13:00:00',
          horas_trabajadas: 5,
          es_registro_manual: true,
          motivo_contingencia: dto.motivo_contingencia,
        }),
      ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [AsistenciaControlador],
      providers: [
        {
          provide: AsistenciaServicio,
          useValue: asistencia_servicio_mock,
        },
      ],
    })
      .overrideGuard(JwtGuardia)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuardia)
      .useValue({ canActivate: () => true })
      .compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new FiltroExcepcionesGlobal());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('debe aceptar el registro manual con los campos enviados desde el modal web', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/asistencia/manual')
      .send({
        becario_id: 1,
        tipo: 'practicas',
        fecha: '2026-11-25',
        hora_ingreso: '08:00',
        hora_salida: '13:00',
        lugar_nombre: 'Oficina Central Bloque A',
        motivo_contingencia: 'No tenía descargada la app/ no podía descargarla',
        horas_trabajadas: 5,
        registrado_por: 'Administrador',
      });

    const cuerpo = respuesta.body as { id?: number };
    expect(respuesta.status).toBe(201);
    expect(cuerpo.id).toBe(99);
    expect(
      asistencia_servicio_mock.registrarAsistenciaManual,
    ).toHaveBeenCalled();
  });

  it('debe aceptar el registro manual canónico sin campos adicionales', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/asistencia/manual')
      .send({
        becario_id: 1,
        tipo: 'practicas',
        fecha: '2026-11-25',
        hora_ingreso: '08:00',
        hora_salida: '13:00',
        motivo_contingencia: 'No tenía descargada la app/ no podía descargarla',
      });

    const cuerpo = respuesta.body as { id?: number };
    expect(respuesta.status).toBe(201);
    expect(cuerpo.id).toBe(99);
  });

  it('debe rechazar con ERR-5002 cuando falta fecha o tiene formato inválido', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/asistencia/manual')
      .send({
        becario_id: 1,
        tipo: 'practicas',
        fecha: '',
        hora_ingreso: '08:00',
        hora_salida: '13:00',
      });

    const cuerpo = respuesta.body as { codigo_error?: string };
    expect(respuesta.status).toBe(400);
    expect(cuerpo.codigo_error).toBe('ERR-5002');
    expect(
      asistencia_servicio_mock.registrarAsistenciaManual,
    ).not.toHaveBeenCalled();
  });
});

describe('AsistenciaControlador + AsistenciaServicio real - Serialización JSON', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [AsistenciaControlador],
      providers: [
        AsistenciaServicio,
        {
          provide: getRepositoryToken(RegistroAsistencia),
          useValue: {
            create: jest.fn((datos: Record<string, unknown>) => ({ ...datos })),
            save: jest.fn((datos: Record<string, unknown>) =>
              Promise.resolve(Object.assign(datos, { id: 28 })),
            ),
          },
        },
        {
          provide: getRepositoryToken(Becario),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 2, usuario_id: 33 }),
          },
        },
        {
          provide: getRepositoryToken(LugarPractica),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(HorarioApoyo),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(Iglesia),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(Evento),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(Multa),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: getRepositoryToken(Justificacion),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
      ],
    })
      .overrideGuard(JwtGuardia)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuardia)
      .useValue({ canActivate: () => true })
      .compile();

    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new FiltroExcepcionesGlobal());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('debe responder 201 y JSON serializable sin referencias circulares al registrar asistencia manual', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/asistencia/manual')
      .send({
        becario_id: 2,
        tipo: 'practicas',
        fecha: '2026-11-25',
        hora_ingreso: '14:30',
        hora_salida: '17:30',
        motivo_contingencia: 'No descargarlo app',
        lugar_practica_id: 1,
      });

    const cuerpo = respuesta.body as {
      id?: number;
      es_registro_manual?: boolean;
      horas_trabajadas?: number;
      registro?: { id?: number };
      mensaje?: string;
    };
    expect(respuesta.status).toBe(201);
    expect(cuerpo.id).toBe(28);
    expect(cuerpo.es_registro_manual).toBe(true);
    expect(cuerpo.horas_trabajadas).toBe(3);
    expect(cuerpo.registro?.id).toBe(28);
    expect(cuerpo.mensaje).toBe(
      'Asistencia manual registrada satisfactoriamente.',
    );
  });
});
