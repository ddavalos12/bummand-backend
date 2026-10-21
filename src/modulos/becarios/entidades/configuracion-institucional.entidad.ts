import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('configuraciones_institucionales')
export class ConfiguracionInstitucional {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'confirmacion_datos_activa', type: 'boolean', default: false })
  confirmacion_datos_activa: boolean;

  @Column({ name: 'fecha_ultima_orden_confirmacion', type: 'timestamp', nullable: true })
  fecha_ultima_orden_confirmacion: Date | null;

  @Column({ name: 'emitida_por_usuario_id', type: 'int', nullable: true })
  emitida_por_usuario_id: number | null;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fecha_actualizacion: Date;
}
