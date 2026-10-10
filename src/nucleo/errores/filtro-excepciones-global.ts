import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  CODIGOS_ERROR,
  CodigoError,
  DESCRIPCIONES_ERROR,
  DOMINIOS_ERROR,
} from './codigos-error.constante';
import { ExcepcionBumand } from './excepcion-bumand';

export interface RespuestaErrorApi {
  codigo_error: string;
  tipo: string;
  mensaje: string;
  detalles: unknown[];
  marca_tiempo: string;
  ruta: string;
  metodo: string;
}

@Catch()
export class FiltroExcepcionesGlobal implements ExceptionFilter {
  private readonly registrador = new Logger(FiltroExcepcionesGlobal.name);

  public catch(excepcion: unknown, host: ArgumentsHost): void {
    const contexto_http = host.switchToHttp();
    const respuesta = contexto_http.getResponse<Response>();
    const peticion = contexto_http.getRequest<Request>();

    let estado_http = HttpStatus.INTERNAL_SERVER_ERROR;
    let codigo_error: CodigoError = CODIGOS_ERROR.ERR_9001;
    let mensaje = DESCRIPCIONES_ERROR[CODIGOS_ERROR.ERR_9001];
    let detalles: unknown[] = [];

    if (excepcion instanceof ExcepcionBumand) {
      estado_http = excepcion.getStatus();
      codigo_error = excepcion.codigo_error;
      const respuesta_interna = excepcion.getResponse();
      if (typeof respuesta_interna === 'object' && respuesta_interna !== null) {
        const obj = respuesta_interna as Record<string, unknown>;
        mensaje = typeof obj.mensaje === 'string' ? obj.mensaje : excepcion.message;
      } else {
        mensaje = excepcion.message;
      }
      detalles = this.normalizarDetalles(excepcion.detalles);
    } else if (excepcion instanceof HttpException) {
      estado_http = excepcion.getStatus();
      const respuesta_http = excepcion.getResponse();
      const resolucion = this.resolverHttpException(excepcion, estado_http, respuesta_http);
      codigo_error = resolucion.codigo_error;
      mensaje = resolucion.mensaje;
      detalles = resolucion.detalles;
    } else {
      estado_http = HttpStatus.INTERNAL_SERVER_ERROR;
      codigo_error = CODIGOS_ERROR.ERR_9001;
      mensaje = DESCRIPCIONES_ERROR[CODIGOS_ERROR.ERR_9001];
      const mensaje_traza = excepcion instanceof Error ? excepcion.stack || excepcion.message : String(excepcion);
      this.registrador.error(`Error no controlado en ${peticion?.method ?? 'DESCONOCIDO'} ${peticion?.url ?? ''}: ${mensaje_traza}`);
      detalles = process.env.NODE_ENV === 'production' ? [] : [excepcion instanceof Error ? excepcion.message : String(excepcion)];
    }

    const tipo = DOMINIOS_ERROR[codigo_error] || 'SISTEMA';

    const cuerpo_respuesta: RespuestaErrorApi = {
      codigo_error,
      tipo,
      mensaje,
      detalles,
      marca_tiempo: new Date().toISOString(),
      ruta: peticion?.url || '',
      metodo: peticion?.method || 'GET',
    };

    respuesta.status(estado_http).json(cuerpo_respuesta);
  }

  private normalizarDetalles(detalles_crudos: unknown): unknown[] {
    if (Array.isArray(detalles_crudos)) {
      return detalles_crudos;
    }
    if (detalles_crudos !== null && detalles_crudos !== undefined) {
      return [detalles_crudos];
    }
    return [];
  }

  private resolverHttpException(
    excepcion: HttpException,
    estado_http: number,
    respuesta_http: unknown,
  ): { codigo_error: CodigoError; mensaje: string; detalles: unknown[] } {
    let mensaje_extraido = excepcion.message;
    let detalles_extraidos: unknown[] = [];

    if (typeof respuesta_http === 'object' && respuesta_http !== null) {
      const objeto_respuesta = respuesta_http as Record<string, unknown>;
      if (
        typeof objeto_respuesta.codigo_error === 'string' &&
        Object.values(CODIGOS_ERROR).includes(objeto_respuesta.codigo_error as CodigoError)
      ) {
        return {
          codigo_error: objeto_respuesta.codigo_error as CodigoError,
          mensaje: typeof objeto_respuesta.mensaje === 'string' ? objeto_respuesta.mensaje : excepcion.message,
          detalles: this.normalizarDetalles(objeto_respuesta.detalles),
        };
      }
      if (Array.isArray(objeto_respuesta.message)) {
        detalles_extraidos = objeto_respuesta.message;
        mensaje_extraido = 'Validación fallida: campos obligatorios vacíos o con formato inválido';
        return {
          codigo_error: CODIGOS_ERROR.ERR_5002,
          mensaje: mensaje_extraido,
          detalles: detalles_extraidos,
        };
      }
      if (typeof objeto_respuesta.message === 'string') {
        mensaje_extraido = objeto_respuesta.message;
      } else if (typeof objeto_respuesta.mensaje === 'string') {
        mensaje_extraido = objeto_respuesta.mensaje;
      }
    } else if (typeof respuesta_http === 'string') {
      mensaje_extraido = respuesta_http;
    }

    const texto_analisis = mensaje_extraido.toLowerCase();

    if (estado_http === HttpStatus.NOT_FOUND) {
      return {
        codigo_error: CODIGOS_ERROR.ERR_9002,
        mensaje: mensaje_extraido,
        detalles: detalles_extraidos,
      };
    }

    if (estado_http === HttpStatus.UNAUTHORIZED) {
      const es_token = texto_analisis.includes('token') || texto_analisis.includes('expirado') || texto_analisis.includes('jwt');
      return {
        codigo_error: es_token ? CODIGOS_ERROR.ERR_1002 : CODIGOS_ERROR.ERR_1001,
        mensaje: mensaje_extraido,
        detalles: detalles_extraidos,
      };
    }

    if (estado_http === HttpStatus.FORBIDDEN) {
      const es_inactivo = texto_analisis.includes('deshabilitado') || texto_analisis.includes('inactivo');
      return {
        codigo_error: es_inactivo ? CODIGOS_ERROR.ERR_1004 : CODIGOS_ERROR.ERR_1003,
        mensaje: mensaje_extraido,
        detalles: detalles_extraidos,
      };
    }

    if (estado_http === HttpStatus.CONFLICT) {
      if (texto_analisis.includes('asistencia') || texto_analisis.includes('ingreso') || texto_analisis.includes('marcación')) {
        return {
          codigo_error: CODIGOS_ERROR.ERR_2003,
          mensaje: mensaje_extraido,
          detalles: detalles_extraidos,
        };
      }
      if (
        texto_analisis.includes('solicitud') ||
        texto_analisis.includes('viático') ||
        texto_analisis.includes('pasaje') ||
        texto_analisis.includes('periodo')
      ) {
        return {
          codigo_error: CODIGOS_ERROR.ERR_3003,
          mensaje: mensaje_extraido,
          detalles: detalles_extraidos,
        };
      }
      return {
        codigo_error: CODIGOS_ERROR.ERR_5002,
        mensaje: mensaje_extraido,
        detalles: detalles_extraidos,
      };
    }

    if (estado_http === HttpStatus.BAD_REQUEST) {
      if (texto_analisis.includes('24') || texto_analisis.includes('día 24')) {
        return { codigo_error: CODIGOS_ERROR.ERR_3001, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('centavo') || texto_analisis.includes('tarifa')) {
        return { codigo_error: CODIGOS_ERROR.ERR_3002, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('observación') || texto_analisis.includes('observacion')) {
        return { codigo_error: CODIGOS_ERROR.ERR_3004, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('geocerca') || (texto_analisis.includes('radio') && texto_analisis.includes('gps'))) {
        return { codigo_error: CODIGOS_ERROR.ERR_2001, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('geodésico') || texto_analisis.includes('geodesico')) {
        return { codigo_error: CODIGOS_ERROR.ERR_4002, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('ventana horaria') || texto_analisis.includes('horaria')) {
        return { codigo_error: CODIGOS_ERROR.ERR_2002, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('ingreso ya registrada')) {
        return { codigo_error: CODIGOS_ERROR.ERR_2003, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('ingreso previa')) {
        return { codigo_error: CODIGOS_ERROR.ERR_2004, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('evento') && (texto_analisis.includes('cancelado') || texto_analisis.includes('finalizado'))) {
        return { codigo_error: CODIGOS_ERROR.ERR_4001, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (texto_analisis.includes('devocional') || texto_analisis.includes('reflexión') || texto_analisis.includes('reflexion')) {
        return { codigo_error: CODIGOS_ERROR.ERR_4003, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      if (
        texto_analisis.includes('justificación') ||
        texto_analisis.includes('justificacion') ||
        texto_analisis.includes('fundamentación') ||
        texto_analisis.includes('fundamentacion')
      ) {
        return { codigo_error: CODIGOS_ERROR.ERR_4004, mensaje: mensaje_extraido, detalles: detalles_extraidos };
      }
      return {
        codigo_error: CODIGOS_ERROR.ERR_5002,
        mensaje: mensaje_extraido,
        detalles: detalles_extraidos,
      };
    }

    return {
      codigo_error: estado_http >= 500 ? CODIGOS_ERROR.ERR_9001 : CODIGOS_ERROR.ERR_5002,
      mensaje: mensaje_extraido,
      detalles: detalles_extraidos,
    };
  }
}
