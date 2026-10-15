import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Becario } from './becario.entidad';

@Entity('horarios_apoyo')
export class HorarioApoyo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id', type: 'int' })
  becario_id: number;

  @ManyToOne(() => Becario, (becario) => becario.horarios_apoyo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @Column({ name: 'dia_semana', type: 'smallint', comment: '0: Domingo, 1: Lunes ... 6: Sábado' })
  dia_semana: number;

  @Column({ name: 'hora_inicio', type: 'varchar', length: 10, example: '08:00' } as any)
  hora_inicio: string;

  @Column({ name: 'hora_fin', type: 'varchar', length: 10, example: '12:00' } as any)
  hora_fin: string;

  @Column({ name: 'horas_diarias', type: 'decimal', precision: 4, scale: 2, default: 4.0 })
  horas_diarias: number;

  @Column({ type: 'varchar', length: 30, nullable: true, default: 'mañana' })
  turno: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
