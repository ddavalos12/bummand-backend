import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SolicitudPasajes } from './solicitud-pasaje.entidad';

export enum Tramo {
  IDA = 'ida',
  VUELTA = 'vuelta',
}

@Entity('recorridos')
export class Recorrido {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'solicitud_id' })
  solicitudId: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'enum', enum: Tramo })
  tramo: Tramo;

  @Column({ type: 'varchar', length: 150 })
  origen: string;

  @Column({ type: 'varchar', length: 150 })
  destino: string;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  tarifa: number;

  @Column({ name: 'lat_origen', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latOrigen: number;

  @Column({ name: 'lng_origen', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lngOrigen: number;

  @Column({ name: 'lat_destino', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latDestino: number;

  @Column({ name: 'lng_destino', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lngDestino: number;

  @Column({ name: 'apoyo_realizado', type: 'varchar', length: 255, nullable: true })
  apoyoRealizado: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => SolicitudPasajes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: SolicitudPasajes;
}
