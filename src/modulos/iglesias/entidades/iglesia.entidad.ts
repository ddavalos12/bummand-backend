import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';

@Entity('iglesias')
export class Iglesia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @OneToMany(() => Becario, (becario) => becario.iglesia)
  becarios: Becario[];
}
