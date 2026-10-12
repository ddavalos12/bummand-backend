import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { RegistroAsistencia } from './registro-asistencia.entidad';

@Entity('multas')
export class Multa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ name: 'asistencia_id', nullable: true })
  asistencia_id: number | null;

  @Column({ name: 'minutos_retraso', type: 'int' })
  minutos_retraso: number;

  @Column({ name: 'monto_bs', type: 'decimal', precision: 10, scale: 2 })
  monto_bs: number;

  @Column({ type: 'varchar', length: 255 })
  motivo: string;

  @Column({ name: 'fecha_aplicacion', type: 'timestamp' })
  fecha_aplicacion: Date;

  @Column({ name: 'es_institucional', type: 'boolean', default: true })
  es_institucional: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => RegistroAsistencia, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'asistencia_id' })
  asistencia: RegistroAsistencia | null;
}
