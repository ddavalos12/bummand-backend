import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

export enum TipoIncidencia {
  ASISTENCIA_PRACTICAS = 'asistencia_practicas',
  ASISTENCIA_EVENTO = 'asistencia_evento',
  ESCUELA_LIDERES = 'escuela_lideres',
  OTRO = 'otro',
}

export enum EstadoJustificacion {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
}

@Entity('justificaciones')
export class Justificacion {
  @ApiProperty({ example: 1, description: 'Identificador único de la justificación' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 5, description: 'Identificador del becario que presenta la solicitud' })
  @Column({ name: 'becario_id' })
  becario_id: number;

  @ApiProperty({
    enum: TipoIncidencia,
    example: TipoIncidencia.ASISTENCIA_PRACTICAS,
    description: 'Tipo de actividad o registro objeto de la justificación',
  })
  @Column({ name: 'tipo_incidencia', type: 'varchar', length: 50 })
  tipo_incidencia: TipoIncidencia;

  @ApiProperty({ example: 12, description: 'ID de referencia externa (registro de asistencia o evento)', required: false })
  @Column({ name: 'referencia_id', type: 'int', nullable: true })
  referencia_id: number | null;

  @ApiProperty({ example: '2026-10-15', description: 'Fecha en la que ocurrió la falta, retraso o incidencia' })
  @Column({ name: 'fecha_incidencia', type: 'date' })
  fecha_incidencia: Date;

  @ApiProperty({ example: 'Cita médica odontológica de urgencia', description: 'Motivo sintético o causa' })
  @Column({ type: 'varchar', length: 200 })
  motivo: string;

  @ApiProperty({ example: 'Adjunto constancia médica emitida por el seguro universitario.', description: 'Explicación detallada de los hechos' })
  @Column({ type: 'text' })
  descripcion: string;

  @ApiProperty({ description: 'URL o path del archivo o fotografía probatoria adjunta', required: false })
  @Column({ name: 'archivo_prueba_url', type: 'text', nullable: true })
  archivo_prueba_url: string | null;

  @ApiProperty({ description: 'Nombre original del archivo de prueba', required: false })
  @Column({ name: 'nombre_archivo_prueba', type: 'varchar', length: 255, nullable: true })
  nombre_archivo_prueba: string | null;

  @ApiProperty({
    enum: EstadoJustificacion,
    example: EstadoJustificacion.PENDIENTE,
    description: 'Estado de resolución administrativa',
  })
  @Column({ type: 'varchar', length: 30, default: EstadoJustificacion.PENDIENTE })
  estado: EstadoJustificacion;

  @ApiProperty({ example: 2, description: 'Identificador del supervisor que resuelve la solicitud', required: false })
  @Column({ name: 'supervisor_id', type: 'int', nullable: true })
  supervisor_id: number | null;

  @ApiProperty({ example: 'Justificación aceptada con respaldo documental.', description: 'Dictamen y observaciones del supervisor', required: false })
  @Column({ name: 'observacion_supervisor', type: 'text', nullable: true })
  observacion_supervisor: string | null;

  @ApiProperty({ description: 'Fecha y hora en la que se dictaminó la resolución', required: false })
  @Column({ name: 'fecha_resolucion', type: 'timestamp', nullable: true })
  fecha_resolucion: Date | null;

  @ApiProperty({ description: 'Fecha y hora de creación de la solicitud' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor?: Usuario | null;
}
