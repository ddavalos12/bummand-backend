import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

export interface OpcionPreguntaBienestar {
  inciso: string;
  texto: string;
  puntaje: number;
  semaforo?: 'verde' | 'amarillo' | 'rojo' | string;
}

@Entity('preguntas_bienestar')
export class PreguntaBienestar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'numero_orden', type: 'int' })
  numero_orden: number;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text' })
  enunciado: string;

  @Column({ type: 'varchar', length: 100 })
  categoria: string;

  @Column({ type: 'jsonb' })
  opciones: OpcionPreguntaBienestar[];

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
