import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('paradas_transporte')
export class ParadaTransporte {
  @ApiProperty({ example: 1, description: 'Identificador único de la parada' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'La Ceja - Calle 1', description: 'Nombre o denominación habitual del punto de parada' })
  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @ApiProperty({ example: 'Ceja', description: 'Zona o barrio de ubicación' })
  @Column({ type: 'varchar', length: 100 })
  zona: string;

  @ApiProperty({ example: 'El Alto', description: 'Ciudad donde radica la parada', enum: ['La Paz', 'El Alto'] })
  @Column({ type: 'varchar', length: 50 })
  ciudad: string;

  @ApiProperty({ example: -16.5085, description: 'Latitud geográfica de la parada' })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud: number;

  @ApiProperty({ example: -68.1633, description: 'Longitud geográfica de la parada' })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud: number;

  @ApiProperty({ example: 'Minibús / Teleférico', description: 'Modalidades de transporte habituales' })
  @Column({ name: 'tipo_transporte', type: 'varchar', length: 100 })
  tipo_transporte: string;

  @ApiProperty({ example: 2.60, description: 'Tarifa referencial aproximada en Bolivianos (Bs)' })
  @Column({ name: 'tarifa_referencial', type: 'decimal', precision: 5, scale: 2, default: 2.60 })
  tarifa_referencial: number;

  @ApiProperty({ example: true, description: 'Indica si es un nodo neurálgico o intercambiador de transporte' })
  @Column({ name: 'es_nodo_principal', type: 'boolean', default: false })
  es_nodo_principal: boolean;

  @ApiProperty({ description: 'Fecha de registro de la parada' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}

export const PARADAS_OFICIALES_DEFECTO: Partial<ParadaTransporte>[] = [];

