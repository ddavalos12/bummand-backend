import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';

@Entity('lugares_practica')
export class LugarPractica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitud: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitud: number;

  @Column({ name: 'radio_tolerancia_m', type: 'int' })
  radioToleranciaM: number;

  @OneToMany(() => Becario, (becario) => becario.lugarPractica)
  becarios: Becario[];
}
