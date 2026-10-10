import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tarifas_transporte')
export class TarifaTransporte {
  @ApiProperty({ example: 1, description: 'Identificador único de la tarifa' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Minibús Tramo Directo', description: 'Nombre o medio de transporte' })
  @Column({ name: 'medio_transporte', type: 'varchar', length: 100 })
  medio_transporte: string;

  @ApiProperty({ example: 'Ruta troncal La Paz / El Alto', description: 'Descripción de la cobertura de la tarifa' })
  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @ApiProperty({ example: 2.60, description: 'Costo oficial fijado en Bolivianos (Bs)' })
  @Column({ name: 'costo_bs', type: 'decimal', precision: 5, scale: 2 })
  costo_bs: number;

  @ApiProperty({ example: 'urbano', description: 'Tipo de tramo: urbano o interciudad' })
  @Column({ name: 'tramo_tipo', type: 'varchar', length: 50, default: 'urbano' })
  tramo_tipo: string;

  @ApiProperty({ example: true, description: 'Estado activo para selección en el catálogo' })
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
