import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';

@Entity('reportes_generados')
export class ReporteGenerado {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ type: 'varchar', length: 20 })
  periodo: string;

  @Column({ name: 'url_pdf', type: 'varchar', length: 255 })
  url_pdf: string;

  @CreateDateColumn({ name: 'fecha_generacion' })
  fecha_generacion: Date;

  @ManyToOne(() => Becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;
}
