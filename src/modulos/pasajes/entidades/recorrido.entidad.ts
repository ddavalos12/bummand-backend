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
  solicitud_id: number;

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
  lat_origen: number;

  @Column({ name: 'lng_origen', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lng_origen: number;

  @Column({ name: 'lat_destino', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lat_destino: number;

  @Column({ name: 'lng_destino', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lng_destino: number;

  @Column({ name: 'apoyo_realizado', type: 'varchar', length: 255, nullable: true })
  apoyo_realizado: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Getters / Setters de compatibilidad
  get solicitudId(): number { return this.solicitud_id; }
  set solicitudId(v: number) { this.solicitud_id = v; }

  get latOrigen(): number { return this.lat_origen; }
  set latOrigen(v: number) { this.lat_origen = v; }

  get lngOrigen(): number { return this.lng_origen; }
  set lngOrigen(v: number) { this.lng_origen = v; }

  get latDestino(): number { return this.lat_destino; }
  set latDestino(v: number) { this.lat_destino = v; }

  get lngDestino(): number { return this.lng_destino; }
  set lngDestino(v: number) { this.lng_destino = v; }

  get apoyoRealizado(): string { return this.apoyo_realizado; }
  set apoyoRealizado(v: string) { this.apoyo_realizado = v; }

  get createdAt(): Date { return this.created_at; }
  set createdAt(v: Date) { this.created_at = v; }

  @ManyToOne(() => SolicitudPasajes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: SolicitudPasajes;
}
