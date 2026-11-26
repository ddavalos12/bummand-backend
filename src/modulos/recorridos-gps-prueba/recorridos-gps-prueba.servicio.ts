import { createHash } from 'crypto';
import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AlertaAntifraudeGps,
  PuntoGpsPruebaGuardado,
  RecorridoGpsPrueba,
} from './entidades/recorrido-gps-prueba.entidad';
import {
  CrearRecorridoGpsPruebaDto,
  PuntoGpsPruebaDto,
} from './dtos/crear-recorrido-gps-prueba.dto';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';
import { calcularDistanciaMetros } from '../../utilidades/geo.utilidad';

const UMBRAL_DESFASE_RELOJ_GPS_SEG = 120;
const UMBRAL_MANIPULACION_RELOJ_SEG = 45;
const UMBRAL_SALTO_DISTANCIA_M = 250;
const UMBRAL_VELOCIDAD_ANOMALA_MS = 44.44;
const UMBRAL_HORA_FUTURA_SERVIDOR_SEG = 180;

function sha256Hex(cadena: string): string {
  return createHash('sha256').update(cadena, 'utf8').digest('hex');
}

@Injectable()
export class RecorridosGpsPruebaServicio {
  constructor(
    @InjectRepository(RecorridoGpsPrueba)
    private readonly recorrido_prueba_repo: Repository<RecorridoGpsPrueba>,
    @Optional()
    private readonly tiempo_real_gateway?: TiempoRealGateway,
  ) {}

  private normalizarRecorrido(entidad: RecorridoGpsPrueba): RecorridoGpsPrueba {
    return {
      ...entidad,
      distancia_total_metros: Number(entidad.distancia_total_metros ?? 0),
    };
  }

  /**
   * Verifica la cadena criptográfica SHA-256 punto por punto desde GENESIS
   * y valida el hash consolidado de sesión emitido por el cliente.
   */
  verificarIntegridadCadena(
    uuid_sesion: string,
    puntos_ordenados: PuntoGpsPruebaDto[],
    duracion_monotonica_seg: number,
    hash_integridad_cliente?: string,
  ): boolean {
    let integridad_valida = true;
    let ultimo_hash = 'GENESIS';

    for (let idx = 0; idx < puntos_ordenados.length; idx++) {
      const punto = puntos_ordenados[idx];
      const lat_6 = Number(punto.latitud).toFixed(6);
      const lng_6 = Number(punto.longitud).toFixed(6);
      const prec_1 = Number(punto.precision_m ?? 0).toFixed(1);
      const hora_gps_norm = punto.hora_gps_iso ?? punto.hora_dispositivo_iso;
      const simulada_bit = punto.es_ubicacion_simulada ? '1' : '0';
      const hash_anterior = idx === 0 ? 'GENESIS' : ultimo_hash;

      const cadena = `${uuid_sesion}|${punto.secuencia}|${lat_6}|${lng_6}|${prec_1}|${hora_gps_norm}|${punto.hora_dispositivo_iso}|${punto.reloj_monotonico_ms}|${simulada_bit}|${hash_anterior}`;
      const hash_calculado = sha256Hex(cadena);

      if (
        punto.hash_punto !== undefined &&
        punto.hash_punto !== null &&
        punto.hash_punto !== hash_calculado
      ) {
        integridad_valida = false;
      }

      ultimo_hash = hash_calculado;
    }

    const hash_sesion_calc = sha256Hex(
      `${uuid_sesion}|${puntos_ordenados.length}|${ultimo_hash}|${duracion_monotonica_seg}`,
    );

    if (
      hash_integridad_cliente !== undefined &&
      hash_integridad_cliente !== null &&
      hash_integridad_cliente !== hash_sesion_calc
    ) {
      integridad_valida = false;
    }

    return integridad_valida;
  }

  /**
   * Evalúa heurísticas anti-fraude sobre reloj monotónico, GPS simulado,
   * saltos cinemáticos Haversine, hora futura e integridad SHA-256.
   */
  evaluarAlertasAntifraude(
    dto: CrearRecorridoGpsPruebaDto,
    puntos_ordenados: PuntoGpsPruebaDto[],
    hora_recepcion_servidor: Date,
    integridad_verificada: boolean,
  ): AlertaAntifraudeGps[] {
    const alertas: AlertaAntifraudeGps[] = [];

    const punto_simulado = puntos_ordenados.find(
      (p) => p.es_ubicacion_simulada === true,
    );
    if (punto_simulado) {
      alertas.push({
        codigo: 'UBICACION_SIMULADA',
        severidad: 'alta',
        secuencia: punto_simulado.secuencia,
        mensaje:
          'Se detectó ubicación simulada (Mock Location) reportada por el dispositivo.',
      });
    }

    const punto_desfase = puntos_ordenados.find(
      (p) =>
        p.desfase_reloj_gps_seg !== undefined &&
        p.desfase_reloj_gps_seg !== null &&
        Math.abs(p.desfase_reloj_gps_seg) > UMBRAL_DESFASE_RELOJ_GPS_SEG,
    );
    if (punto_desfase) {
      alertas.push({
        codigo: 'DESFASE_RELOJ_GPS',
        severidad: 'alta',
        secuencia: punto_desfase.secuencia,
        mensaje: `Desfase entre reloj del dispositivo y tiempo satelital GPS superior a ${UMBRAL_DESFASE_RELOJ_GPS_SEG}s (${punto_desfase.desfase_reloj_gps_seg}s).`,
      });
    }

    if (puntos_ordenados.length >= 2) {
      const primero = puntos_ordenados[0];
      const ultimo = puntos_ordenados[puntos_ordenados.length - 1];
      const delta_dispositivo_seg =
        (Date.parse(ultimo.hora_dispositivo_iso) -
          Date.parse(primero.hora_dispositivo_iso)) /
        1000;
      const delta_monotonico_seg =
        (ultimo.reloj_monotonico_ms - primero.reloj_monotonico_ms) / 1000;

      if (
        !Number.isNaN(delta_dispositivo_seg) &&
        Math.abs(delta_dispositivo_seg - delta_monotonico_seg) >
          UMBRAL_MANIPULACION_RELOJ_SEG
      ) {
        alertas.push({
          codigo: 'MANIPULACION_RELOJ_RECORRIDO',
          severidad: 'alta',
          secuencia: ultimo.secuencia,
          mensaje:
            'Diferencia anómala entre el tiempo transcurrido del reloj del sistema y el reloj monotónico durante el recorrido.',
        });
      }
    }

    for (let idx = 1; idx < puntos_ordenados.length; idx++) {
      const anterior = puntos_ordenados[idx - 1];
      const actual = puntos_ordenados[idx];
      const distancia_m = calcularDistanciaMetros(
        Number(anterior.latitud),
        Number(anterior.longitud),
        Number(actual.latitud),
        Number(actual.longitud),
      );
      const delta_seg = Math.max(
        1,
        (actual.reloj_monotonico_ms - anterior.reloj_monotonico_ms) / 1000,
      );
      const velocidad_ms = distancia_m / delta_seg;

      if (
        distancia_m > UMBRAL_SALTO_DISTANCIA_M &&
        velocidad_ms > UMBRAL_VELOCIDAD_ANOMALA_MS
      ) {
        alertas.push({
          codigo: 'SALTO_VELOCIDAD_ANOMALO',
          severidad: 'media',
          secuencia: actual.secuencia,
          mensaje: `Salto espacial anómalo de ${distancia_m.toFixed(1)} m a ${(velocidad_ms * 3.6).toFixed(1)} km/h respecto al punto anterior.`,
        });
      }
    }

    const servidor_ms = hora_recepcion_servidor.getTime();
    const excede_dispositivo = dto.hora_fin_dispositivo
      ? (Date.parse(dto.hora_fin_dispositivo) - servidor_ms) / 1000 >
        UMBRAL_HORA_FUTURA_SERVIDOR_SEG
      : false;
    const excede_gps = dto.hora_fin_gps
      ? (Date.parse(dto.hora_fin_gps) - servidor_ms) / 1000 >
        UMBRAL_HORA_FUTURA_SERVIDOR_SEG
      : false;

    if (excede_dispositivo || excede_gps) {
      alertas.push({
        codigo: 'HORA_FUTURA_SERVIDOR',
        severidad: 'alta',
        mensaje: `La hora de finalización reportada excede la hora del servidor en más de ${UMBRAL_HORA_FUTURA_SERVIDOR_SEG} segundos.`,
      });
    }

    if (!integridad_verificada) {
      alertas.push({
        codigo: 'CADENA_HASH_INVALIDA',
        severidad: 'alta',
        mensaje:
          'La verificación criptográfica SHA-256 de los puntos o de la sesión no coincide con el sello esperado.',
      });
    }

    return alertas;
  }

  async registrarRecorrido(
    dto: CrearRecorridoGpsPruebaDto,
  ): Promise<RecorridoGpsPrueba> {
    const existente = await this.recorrido_prueba_repo.findOne({
      where: { uuid_sesion: dto.uuid_sesion },
    });
    if (existente) {
      return this.normalizarRecorrido(existente);
    }

    const hora_recepcion_servidor = new Date();
    const puntos_ordenados = [...dto.puntos].sort(
      (a, b) => a.secuencia - b.secuencia,
    );

    const integridad_verificada = this.verificarIntegridadCadena(
      dto.uuid_sesion,
      puntos_ordenados,
      dto.duracion_monotonica_seg,
      dto.hash_integridad_cliente,
    );

    const alertas_antifraude = this.evaluarAlertasAntifraude(
      dto,
      puntos_ordenados,
      hora_recepcion_servidor,
      integridad_verificada,
    );

    let distancia_acumulada_m = 0;
    const puntos_guardados: PuntoGpsPruebaGuardado[] = puntos_ordenados.map(
      (punto, idx) => {
        if (idx === 0) {
          return {
            ...punto,
            distancia_tramo_anterior_m: 0,
            velocidad_tramo_kmh: 0,
          };
        }

        const anterior = puntos_ordenados[idx - 1];
        const distancia_tramo = calcularDistanciaMetros(
          Number(anterior.latitud),
          Number(anterior.longitud),
          Number(punto.latitud),
          Number(punto.longitud),
        );
        distancia_acumulada_m += distancia_tramo;

        const delta_seg = Math.max(
          1,
          (punto.reloj_monotonico_ms - anterior.reloj_monotonico_ms) / 1000,
        );
        const velocidad_kmh = (distancia_tramo / delta_seg) * 3.6;

        return {
          ...punto,
          distancia_tramo_anterior_m: Number(distancia_tramo.toFixed(2)),
          velocidad_tramo_kmh: Number(velocidad_kmh.toFixed(2)),
        };
      },
    );

    const entidad = this.recorrido_prueba_repo.create({
      uuid_sesion: dto.uuid_sesion,
      etiqueta_prueba: dto.etiqueta_prueba ?? null,
      dispositivo_info: dto.dispositivo_info ?? null,
      hora_inicio_dispositivo: dto.hora_inicio_dispositivo
        ? new Date(dto.hora_inicio_dispositivo)
        : null,
      hora_fin_dispositivo: dto.hora_fin_dispositivo
        ? new Date(dto.hora_fin_dispositivo)
        : null,
      hora_inicio_gps: dto.hora_inicio_gps ? new Date(dto.hora_inicio_gps) : null,
      hora_fin_gps: dto.hora_fin_gps ? new Date(dto.hora_fin_gps) : null,
      hora_recepcion_servidor,
      zona_horaria_offset_min: dto.zona_horaria_offset_min ?? -240,
      duracion_monotonica_seg: dto.duracion_monotonica_seg,
      intervalo_minutos: dto.intervalo_minutos ?? 5,
      total_puntos: puntos_guardados.length,
      distancia_total_metros: Number(distancia_acumulada_m.toFixed(2)),
      puntos_json: puntos_guardados,
      hash_integridad_cliente: dto.hash_integridad_cliente ?? null,
      integridad_verificada,
      tiene_alerta_fraude: alertas_antifraude.length > 0,
      alertas_antifraude_json: alertas_antifraude,
      estado: 'recibido',
    });

    const guardado = await this.recorrido_prueba_repo.save(entidad);

    this.tiempo_real_gateway?.notificarRecorridoGpsPrueba({
      accion: 'creado',
      id: guardado.id,
      uuid_sesion: guardado.uuid_sesion,
    });

    return this.normalizarRecorrido(guardado);
  }

  async listarTodos(): Promise<RecorridoGpsPrueba[]> {
    const registros = await this.recorrido_prueba_repo.find({
      order: { creado_en: 'DESC', id: 'DESC' },
    });
    return registros.map((registro) => this.normalizarRecorrido(registro));
  }

  async obtenerPorId(id: number): Promise<RecorridoGpsPrueba> {
    const registro = await this.recorrido_prueba_repo.findOne({ where: { id } });
    if (!registro) {
      throw new NotFoundException(
        `No se encontró el recorrido GPS de prueba con ID ${id}`,
      );
    }
    return this.normalizarRecorrido(registro);
  }

  async eliminarPorId(id: number): Promise<{ mensaje: string; id: number }> {
    const registro = await this.recorrido_prueba_repo.findOne({ where: { id } });
    if (!registro) {
      throw new NotFoundException(
        `No se encontró el recorrido GPS de prueba con ID ${id}`,
      );
    }

    await this.recorrido_prueba_repo.remove(registro);

    this.tiempo_real_gateway?.notificarRecorridoGpsPrueba({
      accion: 'eliminado',
      id,
      uuid_sesion: registro.uuid_sesion,
    });

    return {
      mensaje: 'Recorrido GPS de prueba eliminado correctamente.',
      id,
    };
  }
}
