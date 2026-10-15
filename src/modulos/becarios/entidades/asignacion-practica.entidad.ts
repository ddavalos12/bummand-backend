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
import { LugarPractica } from '../../lugares-practica/entidades/lugar-practica.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

@Entity('asignaciones_practica')
export class AsignacionPractica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id', type: 'int' })
  becario_id: number;

  @ManyToOne(() => Becario, (becario) => becario.asignaciones_practica, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @Column({ name: 'lugar_practica_id', type: 'int' })
  lugar_practica_id: number;

  @ManyToOne(() => LugarPractica, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lugar_practica_id' })
  lugar_practica: LugarPractica;

  @Column({ name: 'supervisor_id', type: 'int', nullable: true })
  supervisor_id: number | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario | null;

  @Column({ name: 'area_departamento', type: 'varchar', length: 150, nullable: true })
  area_departamento: string | null;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_conclusion', type: 'date', nullable: true })
  fecha_conclusion: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'vigente' })
  estado: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
