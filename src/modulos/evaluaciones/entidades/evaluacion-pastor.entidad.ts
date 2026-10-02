import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Evaluacion } from './evaluacion.entidad';

@Entity('evaluaciones_pastor')
export class EvaluacionPastor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'evaluacion_id', unique: true })
  evaluacion_id: number;

  @Column({ name: 'pastor_nombre', type: 'varchar', length: 150 })
  pastor_nombre: string;

  @Column({ name: 'pastor_correo', type: 'varchar', length: 150, nullable: true })
  pastor_correo: string;

  @Column({ name: 'pastor_celular', type: 'varchar', length: 30, nullable: true })
  pastor_celular: string;

  @Column({ name: 'iglesia_nombre', type: 'varchar', length: 150 })
  iglesia_nombre: string;

  @Column({ name: 'iglesia_direccion', type: 'varchar', length: 255, nullable: true })
  iglesia_direccion: string;

  @Column({ name: 'campos_formulario', type: 'jsonb', nullable: true })
  campos_formulario: any;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: Date;

  @OneToOne(() => Evaluacion, (evaluacion) => evaluacion.detalle_pastor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluacion_id' })
  evaluacion: Evaluacion;
}
