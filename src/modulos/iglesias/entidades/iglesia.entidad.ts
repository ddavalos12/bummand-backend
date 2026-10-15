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

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitud: number | null;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitud: number | null;

  @Column({ name: 'radio_tolerancia_m', type: 'int', default: 60 })
  radio_tolerancia_m: number;

  @Column({ name: 'pastor_nombre', type: 'varchar', length: 150, nullable: true })
  pastor_nombre: string | null;

  @Column({ name: 'pastor_telefono', type: 'varchar', length: 30, nullable: true })
  pastor_telefono: string | null;

  @Column({ name: 'pastor_correo', type: 'varchar', length: 150, nullable: true })
  pastor_correo: string | null;

  @OneToMany(() => Becario, (becario) => becario.iglesia)
  becarios: Becario[];
}
