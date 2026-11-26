import { createHash } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecorridosGpsPruebaServicio } from './recorridos-gps-prueba.servicio';
import { RecorridoGpsPrueba } from './entidades/recorrido-gps-prueba.entidad';
import {
  CrearRecorridoGpsPruebaDto,
  PuntoGpsPruebaDto,
} from './dtos/crear-recorrido-gps-prueba.dto';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';
import { calcularDistanciaMetros } from '../../utilidades/geo.utilidad';

function calcularSha256(cadena: string): string {
  return createHash('sha256').update(cadena, 'utf8').digest('hex');
}

function firmarRecorridoCliente(
  dto: Omit<CrearRecorridoGpsPruebaDto, 'hash_integridad_cliente'>,
): CrearRecorridoGpsPruebaDto {
  const ordenados = [...dto.puntos].sort((a, b) => a.secuencia - b.secuencia);
  let ultimo_hash = 'GENESIS';

  const puntos_firmados: PuntoGpsPruebaDto[] = ordenados.map((p, idx) => {
    const lat_6 = Number(p.latitud).toFixed(6);
    const lng_6 = Number(p.longitud).toFixed(6);
    const prec_1 = Number(p.precision_m ?? 0).toFixed(1);
    const hora_gps_norm = p.hora_gps_iso ?? p.hora_dispositivo_iso;
    const simulada_bit = p.es_ubicacion_simulada ? '1' : '0';
    const hash_anterior = idx === 0 ? 'GENESIS' : ultimo_hash;
    const cadena = `${dto.uuid_sesion}|${p.secuencia}|${lat_6}|${lng_6}|${prec_1}|${hora_gps_norm}|${p.hora_dispositivo_iso}|${p.reloj_monotonico_ms}|${simulada_bit}|${hash_anterior}`;
    const hash_punto = calcularSha256(cadena);
    ultimo_hash = hash_punto;
    return { ...p, hash_punto };
  });

  const hash_integridad_cliente = calcularSha256(
    `${dto.uuid_sesion}|${puntos_firmados.length}|${ultimo_hash}|${dto.duracion_monotonica_seg}`,
  );

  return {
    ...dto,
    puntos: puntos_firmados,
    hash_integridad_cliente,
  };
}

describe('RecorridosGpsPruebaServicio', () => {
  let servicio: RecorridosGpsPruebaServicio;
  let repo_mock: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let gateway_mock: {
    notificarRecorridoGpsPrueba: jest.Mock;
  };

  beforeEach(async () => {
    repo_mock = {
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest
        .fn()
        .mockImplementation((entidad) =>
          Promise.resolve({
            ...entidad,
            id: entidad.id ?? 1,
            distancia_total_metros: String(entidad.distancia_total_metros ?? 0),
          }),
        ),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    gateway_mock = {
      notificarRecorridoGpsPrueba: jest.fn(),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        RecorridosGpsPruebaServicio,
        {
          provide: getRepositoryToken(RecorridoGpsPrueba),
          useValue: repo_mock,
        },
        {
          provide: TiempoRealGateway,
          useValue: gateway_mock,
        },
      ],
    }).compile();

    servicio = modulo.get<RecorridosGpsPruebaServicio>(
      RecorridosGpsPruebaServicio,
    );
  });

  it('registra un recorrido limpio con SHA-256 válido y calcula la distancia Haversine entre tramos', async () => {
    const base_iso_1 = new Date(Date.now() - 600_000).toISOString();
    const base_iso_2 = new Date(Date.now() - 300_000).toISOString();

    const punto_1: PuntoGpsPruebaDto = {
      secuencia: 1,
      latitud: -16.505,
      longitud: -68.163,
      precision_m: 6.4,
      hora_dispositivo_iso: base_iso_1,
      hora_gps_iso: base_iso_1,
      reloj_monotonico_ms: 100_000,
      desfase_reloj_gps_seg: 2,
      es_ubicacion_simulada: false,
      modo_captura: 'automatico',
    };

    const punto_2: PuntoGpsPruebaDto = {
      secuencia: 2,
      latitud: -16.5095,
      longitud: -68.1585,
      precision_m: 5.0,
      hora_dispositivo_iso: base_iso_2,
      hora_gps_iso: base_iso_2,
      reloj_monotonico_ms: 400_000,
      desfase_reloj_gps_seg: -1,
      es_ubicacion_simulada: false,
      modo_captura: 'automatico',
    };

    const payload_firmado = firmarRecorridoCliente({
      uuid_sesion: 'sesion-limpia-001',
      etiqueta_prueba: 'Ruta Ceja - Villa Dolores',
      dispositivo_info: 'Pixel 8 / Android 14',
      hora_inicio_dispositivo: base_iso_1,
      hora_fin_dispositivo: base_iso_2,
      duracion_monotonica_seg: 300,
      intervalo_minutos: 5,
      puntos: [punto_2, punto_1],
    });

    const distancia_esperada = Number(
      calcularDistanciaMetros(
        punto_1.latitud,
        punto_1.longitud,
        punto_2.latitud,
        punto_2.longitud,
      ).toFixed(2),
    );

    const resultado = await servicio.registrarRecorrido(payload_firmado);

    expect(resultado.integridad_verificada).toBe(true);
    expect(resultado.tiene_alerta_fraude).toBe(false);
    expect(resultado.alertas_antifraude_json).toEqual([]);
    expect(typeof resultado.distancia_total_metros).toBe('number');
    expect(resultado.distancia_total_metros).toBeCloseTo(distancia_esperada, 2);
    expect(resultado.total_puntos).toBe(2);
    expect(resultado.puntos_json[0].secuencia).toBe(1);
    expect(resultado.puntos_json[0].distancia_tramo_anterior_m).toBe(0);
    expect(resultado.puntos_json[1].secuencia).toBe(2);
    expect(resultado.puntos_json[1].distancia_tramo_anterior_m).toBeCloseTo(
      distancia_esperada,
      2,
    );
    expect(resultado.puntos_json[1].velocidad_tramo_kmh).toBeGreaterThan(0);
    expect(gateway_mock.notificarRecorridoGpsPrueba).toHaveBeenCalledWith({
      accion: 'creado',
      id: 1,
      uuid_sesion: 'sesion-limpia-001',
    });
  });

  it('detecta manipulación de reloj del recorrido (MANIPULACION_RELOJ_RECORRIDO) y desfase GPS (DESFASE_RELOJ_GPS)', async () => {
    const t1 = new Date(Date.now() - 900_000).toISOString();
    const t2_alterado = new Date(Date.now() - 100_000).toISOString(); // 800s de pared vs 300s monotónicos

    const payload = firmarRecorridoCliente({
      uuid_sesion: 'sesion-reloj-002',
      duracion_monotonica_seg: 300,
      puntos: [
        {
          secuencia: 1,
          latitud: -16.5,
          longitud: -68.15,
          hora_dispositivo_iso: t1,
          reloj_monotonico_ms: 10_000,
          desfase_reloj_gps_seg: 5,
          es_ubicacion_simulada: false,
        },
        {
          secuencia: 2,
          latitud: -16.501,
          longitud: -68.151,
          hora_dispositivo_iso: t2_alterado,
          reloj_monotonico_ms: 310_000,
          desfase_reloj_gps_seg: 240,
          es_ubicacion_simulada: false,
        },
      ],
    });

    const resultado = await servicio.registrarRecorrido(payload);

    expect(resultado.integridad_verificada).toBe(true);
    expect(resultado.tiene_alerta_fraude).toBe(true);
    const codigos = resultado.alertas_antifraude_json.map((a) => a.codigo);
    expect(codigos).toContain('MANIPULACION_RELOJ_RECORRIDO');
    expect(codigos).toContain('DESFASE_RELOJ_GPS');
    expect(
      resultado.alertas_antifraude_json.every((a) => a.severidad === 'alta'),
    ).toBe(true);
  });

  it('detecta ubicación simulada (UBICACION_SIMULADA) y cadena SHA-256 inválida (CADENA_HASH_INVALIDA)', async () => {
    const t1 = new Date(Date.now() - 300_000).toISOString();
    const t2 = new Date(Date.now() - 150_000).toISOString();

    const payload_firmado = firmarRecorridoCliente({
      uuid_sesion: 'sesion-fraude-003',
      duracion_monotonica_seg: 150,
      puntos: [
        {
          secuencia: 1,
          latitud: -16.5,
          longitud: -68.15,
          hora_dispositivo_iso: t1,
          reloj_monotonico_ms: 50_000,
          es_ubicacion_simulada: true,
        },
        {
          secuencia: 2,
          latitud: -16.502,
          longitud: -68.152,
          hora_dispositivo_iso: t2,
          reloj_monotonico_ms: 200_000,
          es_ubicacion_simulada: false,
        },
      ],
    });

    // Alteración maliciosa de coordenada tras firmar en el cliente
    payload_firmado.puntos[1].latitud = -16.5999;

    const resultado = await servicio.registrarRecorrido(payload_firmado);

    expect(resultado.integridad_verificada).toBe(false);
    expect(resultado.tiene_alerta_fraude).toBe(true);
    const codigos = resultado.alertas_antifraude_json.map((a) => a.codigo);
    expect(codigos).toContain('UBICACION_SIMULADA');
    expect(codigos).toContain('CADENA_HASH_INVALIDA');
  });

  it('detecta salto de velocidad anómalo (SALTO_VELOCIDAD_ANOMALO) y hora futura respecto al servidor (HORA_FUTURA_SERVIDOR)', async () => {
    const t1 = new Date(Date.now() - 60_000).toISOString();
    const t2 = new Date(Date.now() - 55_000).toISOString();
    const hora_futura = new Date(Date.now() + 600_000).toISOString();

    const payload = firmarRecorridoCliente({
      uuid_sesion: 'sesion-salto-004',
      hora_fin_dispositivo: hora_futura,
      duracion_monotonica_seg: 5,
      puntos: [
        {
          secuencia: 1,
          latitud: -16.5,
          longitud: -68.15,
          hora_dispositivo_iso: t1,
          reloj_monotonico_ms: 10_000,
          es_ubicacion_simulada: false,
        },
        {
          secuencia: 2,
          latitud: -16.55,
          longitud: -68.2,
          hora_dispositivo_iso: t2,
          reloj_monotonico_ms: 15_000,
          es_ubicacion_simulada: false,
        },
      ],
    });

    const resultado = await servicio.registrarRecorrido(payload);
    const codigos = resultado.alertas_antifraude_json.map((a) => a.codigo);
    expect(codigos).toContain('SALTO_VELOCIDAD_ANOMALO');
    expect(codigos).toContain('HORA_FUTURA_SERVIDOR');
  });

  it('mantiene idempotencia por uuid_sesion sin duplicar registros ni emitir notificación', async () => {
    const registro_previo = {
      id: 42,
      uuid_sesion: 'sesion-idempotente-005',
      distancia_total_metros: '345.67',
      total_puntos: 3,
      puntos_json: [],
      alertas_antifraude_json: [],
      integridad_verificada: true,
      tiene_alerta_fraude: false,
      estado: 'recibido',
    } as unknown as RecorridoGpsPrueba;

    repo_mock.findOne.mockResolvedValueOnce(registro_previo);

    const resultado = await servicio.registrarRecorrido({
      uuid_sesion: 'sesion-idempotente-005',
      duracion_monotonica_seg: 600,
      puntos: [
        {
          secuencia: 1,
          latitud: -16.5,
          longitud: -68.15,
          hora_dispositivo_iso: new Date().toISOString(),
          reloj_monotonico_ms: 1000,
          es_ubicacion_simulada: false,
        },
      ],
    });

    expect(resultado.id).toBe(42);
    expect(resultado.distancia_total_metros).toBe(345.67);
    expect(repo_mock.save).not.toHaveBeenCalled();
    expect(gateway_mock.notificarRecorridoGpsPrueba).not.toHaveBeenCalled();
  });

  it('lista, obtiene y elimina recorridos normalizando distancia_total_metros y lanzando NotFoundException si no existe', async () => {
    repo_mock.find.mockResolvedValueOnce([
      { id: 2, uuid_sesion: 'u2', distancia_total_metros: '120.50' },
    ]);
    const lista = await servicio.listarTodos();
    expect(lista[0].distancia_total_metros).toBe(120.5);

    repo_mock.findOne.mockResolvedValueOnce({
      id: 2,
      uuid_sesion: 'u2',
      distancia_total_metros: '120.50',
    });
    const uno = await servicio.obtenerPorId(2);
    expect(uno.distancia_total_metros).toBe(120.5);

    repo_mock.findOne.mockResolvedValueOnce(null);
    await expect(servicio.obtenerPorId(999)).rejects.toThrow(NotFoundException);

    repo_mock.findOne.mockResolvedValueOnce({ id: 2, uuid_sesion: 'u2' });
    const eliminado = await servicio.eliminarPorId(2);
    expect(eliminado).toEqual({
      mensaje: 'Recorrido GPS de prueba eliminado correctamente.',
      id: 2,
    });
    expect(gateway_mock.notificarRecorridoGpsPrueba).toHaveBeenCalledWith({
      accion: 'eliminado',
      id: 2,
      uuid_sesion: 'u2',
    });
  });
});
