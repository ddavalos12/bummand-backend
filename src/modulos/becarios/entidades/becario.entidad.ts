import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';
import { Iglesia } from '../../iglesias/entidades/iglesia.entidad';
import { lugar_practica } from '../../lugares-practica/entidades/lugar-practica.entidad';
import { RegistroAsistencia } from '../../asistencia/entidades/registro-asistencia.entidad';

@Entity('becarios')
export class Becario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', unique: true })
  usuario_id: number;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  ci: string;

  @Column({ type: 'varchar', length: 100 })
  carrera: string;

  @Column({ type: 'varchar', length: 150 })
  universidad: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  institucion: string | null;

  @Column({ name: 'iglesia_id', nullable: true })
  iglesia_id: number | null;

  @Column({ name: 'lugar_practica_id', nullable: true })
  lugar_practica_id: number | null;

  @Column({ name: 'fecha_ingreso', type: 'date' })
  fecha_ingreso: Date;

  @Column({ name: 'supervisor_id', nullable: true })
  supervisor_id: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unidad: string | null;

  @OneToOne(() => Usuario, (usuario) => usuario.becario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Usuario, (usuario) => usuario.becarios_supervisados, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario | null;

  @ManyToOne(() => Iglesia, (iglesia) => iglesia.becarios)
  @JoinColumn({ name: 'iglesia_id' })
  iglesia: Iglesia | null;

  @ManyToOne(() => lugar_practica, (lugar_practica) => lugar_practica.becarios)
  @JoinColumn({ name: 'lugar_practica_id' })
  lugar_practica: lugar_practica | null;

  @OneToMany(() => RegistroAsistencia, (registro) => registro.becario)
  registros_asistencia: RegistroAsistencia[];
}

