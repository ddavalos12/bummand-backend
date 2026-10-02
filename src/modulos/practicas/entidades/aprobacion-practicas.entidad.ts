import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

@Entity('aprobaciones_practicas')
export class AprobacionPracticas {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ name: 'supervisor_id' })
  supervisor_id: number;

  @Column({ type: 'varchar', length: 20 })
  periodo: string;

  @Column({ name: 'horas_aprobadas', type: 'decimal', precision: 6, scale: 2 })
  horas_aprobadas: number;

  @Column({ name: 'firma_digital', type: 'text' })
  firma_digital: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario;
}
