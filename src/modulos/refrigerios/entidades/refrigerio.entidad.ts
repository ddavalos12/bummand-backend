import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Evento } from '../../eventos/entidades/evento.entidad';
import { LugarPractica } from '../../lugares-practica/entidades/lugar-practica.entidad';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';

@Entity('refrigerios')
export class Refrigerio {
  @ApiProperty({ example: 1, description: 'Identificador único del refrigerio' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: '2026-10-12', description: 'Fecha del suministro del refrigerio' })
  @Column({ type: 'date' })
  fecha: Date;

  @ApiPropertyOptional({ example: 3, description: 'ID del evento institucional asociado (opcional)' })
  @Column({ name: 'evento_id', type: 'int', nullable: true })
  evento_id: number | null;

  @ApiPropertyOptional({ example: 1, description: 'ID de la sede o lugar de práctica asociada (opcional)' })
  @Column({ name: 'lugar_practica_id', type: 'int', nullable: true })
  lugar_practica_id: number | null;

  @ApiProperty({ example: 'Refrigerio jornada Escuela de Líderes (Empanadas y jugo natural)', description: 'Detalle o descripción del refrigerio' })
  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @ApiProperty({ example: 35, description: 'Cantidad total de raciones suministradas' })
  @Column({ name: 'cantidad_raciones', type: 'int' })
  cantidad_raciones: number;

  @ApiProperty({ example: 7.5, description: 'Costo unitario por ración en bolivianos' })
  @Column({ name: 'costo_unitario_bs', type: 'decimal', precision: 8, scale: 2 })
  costo_unitario_bs: number;

  @ApiProperty({ example: 262.5, description: 'Costo total consolidado en bolivianos' })
  @Column({ name: 'costo_total_bs', type: 'decimal', precision: 10, scale: 2 })
  costo_total_bs: number;

  @ApiProperty({ example: 2, description: 'ID del usuario supervisor o responsable de la rendición' })
  @Column({ name: 'responsable_id', type: 'int' })
  responsable_id: number;

  @ApiPropertyOptional({ example: 4, description: 'ID del becario encargado del refrigerio' })
  @Column({ name: 'becario_id', type: 'int', nullable: true })
  becario_id: number | null;

  @ApiPropertyOptional({ example: 'Nilda Amalia Churata Paye', description: 'Nombre del becario encargado' })
  @Column({ name: 'becario_nombre', type: 'varchar', length: 150, nullable: true })
  becario_nombre: string | null;

  @ApiPropertyOptional({
    description: 'Registros de recepción y conformidad en sistema de los becarios que recibieron el refrigerio',
  })
  @Column({ name: 'firmas_conformidad', type: 'jsonb', nullable: true })
  firmas_conformidad: Record<string, unknown>[] | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Evento, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'evento_id' })
  evento: Evento | null;

  @ManyToOne(() => LugarPractica, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lugar_practica_id' })
  lugar_practica: LugarPractica | null;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'responsable_id' })
  responsable: Usuario;
}
