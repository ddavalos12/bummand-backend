import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AsistenciaControlador } from './asistencia.controlador';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistrarAsistenciaManualDto } from './dtos/registrar-asistencia-manual.dto';
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
