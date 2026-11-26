import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export interface PuntoGpsPruebaGuardado {
  secuencia: number;
  latitud: number;
  longitud: number;
  precision_m?: number;
  altitud_m?: number;
  velocidad_ms?: number;
  rumbo_grados?: number;
  hora_dispositivo_iso: string;
  hora_gps_iso?: string;
  reloj_monotonico_ms: number;
  desfase_reloj_gps_seg?: number;
  es_ubicacion_simulada: boolean;
  modo_captura?: string;
  hash_punto?: string;
  distancia_tramo_anterior_m?: number;
  velocidad_tramo_kmh?: number;
}

export interface AlertaAntifraudeGps {
  codigo: string;
  severidad: 'alta' | 'media';
  secuencia?: number;
  mensaje: string;
}

@Entity('recorridos_gps_prueba')
export class RecorridoGpsPrueba {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  uuid_sesion: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  etiqueta_prueba: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  dispositivo_info: string | null;

  @Column({ type: 'timestamp', nullable: true })
  hora_inicio_dispositivo: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  hora_fin_dispositivo: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  hora_inicio_gps: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  hora_fin_gps: Date | null;

  @Column({ type: 'timestamp' })
  hora_recepcion_servidor: Date;

  @Column({ type: 'int', default: -240 })
  zona_horaria_offset_min: number;

  @Column({ type: 'int', default: 0 })
  duracion_monotonica_seg: number;

  @Column({ type: 'int', default: 5 })
  intervalo_minutos: number;

  @Column({ type: 'int', default: 0 })
  total_puntos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  distancia_total_metros: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  puntos_json: PuntoGpsPruebaGuardado[];

  @Column({ type: 'varchar', length: 128, nullable: true })
  hash_integridad_cliente: string | null;

  @Column({ type: 'boolean', default: true })
  integridad_verificada: boolean;

  @Column({ type: 'boolean', default: false })
  tiene_alerta_fraude: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  alertas_antifraude_json: AlertaAntifraudeGps[];

  @Column({ type: 'varchar', length: 30, default: 'recibido' })
  estado: string;

  @CreateDateColumn({ name: 'creado_en' })
  creado_en: Date;
}
