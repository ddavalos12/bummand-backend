import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TiempoRealGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  servidor: Server;

  handleConnection(_cliente: Socket) {}

  handleDisconnect(_cliente: Socket) {}

  private emitirSeguro(evento: string, datos: unknown): void {
    try {
      if (this.servidor && typeof this.servidor.emit === 'function') {
        this.servidor.emit(evento, datos);
      }
    } catch {
      // En entornos serverless sin servidor WebSocket persistente se ignora el fallo de emisión
    }
  }

  notificarAsistencia(datos_asistencia: unknown) {
    this.emitirSeguro('asistencia_actualizada', datos_asistencia);
  }

  notificarPasajes(datos_pasajes: unknown) {
    this.emitirSeguro('pasajes_actualizados', datos_pasajes);
  }

  notificarJustificacion(datos_justificacion: unknown) {
    this.emitirSeguro('justificacion_actualizada', datos_justificacion);
  }

  notificarDevocional(datos_devocional: unknown) {
    this.emitirSeguro('devocional_actualizado', datos_devocional);
  }

  notificarEvento(datos_evento: unknown) {
    this.emitirSeguro('evento_actualizado', datos_evento);
  }

  notificarCodigoTutor(datos_codigo: unknown) {
    this.emitirSeguro('codigo_verificacion_tutor', datos_codigo);
  }

  notificarEvaluacion(datos_evaluacion: unknown) {
    this.emitirSeguro('evaluacion_actualizada', datos_evaluacion);
  }
}
