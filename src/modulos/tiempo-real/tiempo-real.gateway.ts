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
export class TiempoRealGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  servidor: Server;

  handleConnection(cliente: Socket) {
    // Registro de conexión activa
  }

  handleDisconnect(cliente: Socket) {
    // Registro de desconexión
  }

  notificarAsistencia(datos_asistencia: unknown) {
    if (this.servidor) {
      this.servidor.emit('asistencia_actualizada', datos_asistencia);
    }
  }

  notificarPasajes(datos_pasajes: unknown) {
    if (this.servidor) {
      this.servidor.emit('pasajes_actualizados', datos_pasajes);
    }
  }

  notificarJustificacion(datos_justificacion: unknown) {
    if (this.servidor) {
      this.servidor.emit('justificacion_actualizada', datos_justificacion);
    }
  }

  notificarDevocional(datos_devocional: unknown) {
    if (this.servidor) {
      this.servidor.emit('devocional_actualizado', datos_devocional);
    }
  }

  notificarEvento(datos_evento: unknown) {
    if (this.servidor) {
      this.servidor.emit('evento_actualizado', datos_evento);
    }
  }

  notificarCodigoTutor(datos_codigo: unknown) {
    if (this.servidor) {
      this.servidor.emit('codigo_verificacion_tutor', datos_codigo);
    }
  }
}
