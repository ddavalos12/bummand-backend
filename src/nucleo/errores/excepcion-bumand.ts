import { HttpException, HttpStatus } from '@nestjs/common';
import { CodigoError, DESCRIPCIONES_ERROR } from './codigos-error.constante';

export class ExcepcionBumand extends HttpException {
  public readonly codigo_error: CodigoError;
  public readonly detalles?: unknown;

  constructor(
    codigo_error: CodigoError,
    mensaje?: string,
    estado_http: HttpStatus = HttpStatus.BAD_REQUEST,
    detalles?: unknown,
  ) {
    const mensaje_final = mensaje || DESCRIPCIONES_ERROR[codigo_error] || 'Error en la operación';
    super(
      {
        codigo_error,
        mensaje: mensaje_final,
        detalles: detalles ?? null,
      },
      estado_http,
    );
    this.codigo_error = codigo_error;
    this.detalles = detalles;
  }
}
