import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { FiltroExcepcionesGlobal } from './filtro-excepciones-global';
import { CODIGOS_ERROR } from './codigos-error.constante';
import { ExcepcionBumand } from './excepcion-bumand';

describe('FiltroExcepcionesGlobal', () => {
  let filtro: FiltroExcepcionesGlobal;
  let respuesta_mock: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let peticion_mock: {
    url: string;
    method: string;
  };
  let host_mock: ArgumentsHost;

  beforeEach(() => {
    filtro = new FiltroExcepcionesGlobal();
    respuesta_mock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    peticion_mock = {
      url: '/api/v1/prueba',
      method: 'POST',
    };
    host_mock = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => respuesta_mock,
        getRequest: () => peticion_mock,
      }),
    } as unknown as ArgumentsHost;
  });

  it('debe procesar ExcepcionBumand respetando código y estado HTTP', () => {
    const excepcion = new ExcepcionBumand(
      CODIGOS_ERROR.ERR_2001,
      'Ubicación GPS fuera de tolerancia',
      HttpStatus.BAD_REQUEST,
      { distancia_calculada_m: 120 },
    );

    filtro.catch(excepcion, host_mock);

    expect(respuesta_mock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(respuesta_mock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_error: 'ERR-2001',
        tipo: 'ASISTENCIA_GEOCERCA',
        mensaje: 'Ubicación GPS fuera de tolerancia',
        detalles: [{ distancia_calculada_m: 120 }],
        ruta: '/api/v1/prueba',
        metodo: 'POST',
      }),
    );
  });

  it('debe mapear errores de validación de class-validator a ERR-5002', () => {
    const excepcion = new BadRequestException({
      statusCode: 400,
      message: ['El correo debe ser válido', 'La contraseña es requerida'],
      error: 'Bad Request',
    });

    filtro.catch(excepcion, host_mock);

    expect(respuesta_mock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(respuesta_mock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_error: 'ERR-5002',
        tipo: 'CLIENTE_RED_VALIDACION',
        mensaje: 'Validación fallida: campos obligatorios vacíos o con formato inválido',
        detalles: ['El correo debe ser válido', 'La contraseña es requerida'],
      }),
    );
  });

  it('debe mapear regla del día 24 a ERR-3001', () => {
    const excepcion = new BadRequestException('Declaración permitida únicamente a partir del día 24');

    filtro.catch(excepcion, host_mock);

    expect(respuesta_mock.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(respuesta_mock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_error: 'ERR-3001',
        tipo: 'PASAJES_VIATICOS',
      }),
    );
  });

  it('debe mapear UnauthorizedException a ERR-1002 si menciona token expirado', () => {
    const excepcion = new UnauthorizedException('Token JWT expirado');

    filtro.catch(excepcion, host_mock);

    expect(respuesta_mock.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(respuesta_mock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_error: 'ERR-1002',
        tipo: 'AUTENTICACION_SEGURIDAD',
      }),
    );
  });

  it('debe mapear UnauthorizedException genérica a ERR-1001', () => {
    const excepcion = new UnauthorizedException('Credenciales incorrectas');

    filtro.catch(excepcion, host_mock);

    expect(respuesta_mock.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(respuesta_mock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_error: 'ERR-1001',
        tipo: 'AUTENTICACION_SEGURIDAD',
      }),
    );
  });

  it('debe mapear ForbiddenException a ERR-1003', () => {
    const excepcion = new ForbiddenException('No tiene permisos para este recurso');

    filtro.catch(excepcion, host_mock);

    expect(respuesta_mock.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(respuesta_mock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_error: 'ERR-1003',
        tipo: 'AUTENTICACION_SEGURIDAD',
      }),
    );
  });

  it('debe mapear NotFoundException a ERR-9002', () => {
    const excepcion = new NotFoundException('Usuario no encontrado');

    filtro.catch(excepcion, host_mock);

    expect(respuesta_mock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(respuesta_mock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_error: 'ERR-9002',
        tipo: 'SISTEMA',
        mensaje: 'Usuario no encontrado',
      }),
    );
  });

  it('debe mapear error imprevisto a ERR-9001 con estado 500', () => {
    const excepcion = new Error('Fallo crítico en base de datos');

    filtro.catch(excepcion, host_mock);

    expect(respuesta_mock.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(respuesta_mock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo_error: 'ERR-9001',
        tipo: 'SISTEMA',
      }),
    );
  });
});
