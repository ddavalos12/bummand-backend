import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';

export enum TipoAsistencia {
  PRACTICAS = 'practicas',
  ESCUELA_LIDERES = 'escuela_lideres',
  ACCIONES_SERVICIO = 'acciones_servicio',
}

@Entity('registros_asistencia')
export class RegistroAsistencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ type: 'enum', enum: TipoAsistencia })
  tipo: TipoAsistencia;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ name: 'hora_ingreso', type: 'time', nullable: true })
  hora_ingreso: string;

  @Column({ name: 'hora_salida', type: 'time', nullable: true })
  hora_salida: string;

  @Column({ name: 'lat_ingreso', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lat_ingreso: number;

  @Column({ name: 'lng_ingreso', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lng_ingreso: number;

  @Column({ name: 'lat_salida', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lat_salida: number;

  @Column({ name: 'lng_salida', type: 'decimal', precision: 9, scale: 6, nullable: true })
  lng_salida: number;

  @Column({ name: 'horas_trabajadas', type: 'decimal', precision: 5, scale: 2, nullable: true })
  horas_trabajadas: number;

  @Column({ name: 'dentro_de_radio', type: 'boolean', default: false })
  dentro_de_radio: boolean;

  @Column({ name: 'dentro_de_horario', type: 'boolean', nullable: true })
  dentro_de_horario: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Getters / Setters de compatibilidad
  get horaIngreso(): string { return this.hora_ingreso; }
  set horaIngreso(v: string) { this.hora_ingreso = v; }

  get latIngreso(): number { return this.lat_ingreso; }
  set latIngreso(v: number) { this.lat_ingreso = v; }

  get lngIngreso(): number { return this.lng_ingreso; }
  set lngIngreso(v: number) { this.lng_ingreso = v; }

  get latSalida(): number { return this.lat_salida; }
  set latSalida(v: number) { this.lat_salida = v; }

  get lngSalida(): number { return this.lng_salida; }
  set lngSalida(v: number) { this.lng_salida = v; }

  get horasTrabajadas(): number { return this.horas_trabajadas; }
  set horasTrabajadas(v: number) { this.horas_trabajadas = v; }

  get dentroDeRadio(): boolean { return this.dentro_de_radio; }
  set dentroDeRadio(v: boolean) { this.dentro_de_radio = v; }

  get dentroDeHorario(): boolean { return this.dentro_de_horario; }
  set dentroDeHorario(v: boolean) { this.dentro_de_horario = v; }

  get createdAt(): Date { return this.created_at; }
  set createdAt(v: Date) { this.created_at = v; }

  @ManyToOne(() => Becario, (becario) => becario.registros_asistencia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;
}

