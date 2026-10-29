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

export interface DetalleIngredienteRefrigerio {
  insumo: string;
  cantidad?: string;
  costo_bs: number;
  pagado_por_becario_id?: number;
  pagado_por_nombre?: string;
}

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

  @ApiProperty({ example: 23, description: 'Cantidad total de raciones suministradas' })
  @Column({ name: 'cantidad_raciones', type: 'int' })
  cantidad_raciones: number;

  @ApiProperty({ example: 6.0, description: 'Costo unitario por ración en bolivianos' })
  @Column({ name: 'costo_unitario_bs', type: 'decimal', precision: 8, scale: 2 })
  costo_unitario_bs: number;

  @ApiProperty({ example: 138.0, description: 'Costo total consolidado en bolivianos' })
  @Column({ name: 'costo_total_bs', type: 'decimal', precision: 10, scale: 2 })
  costo_total_bs: number;

  @ApiProperty({ example: 2, description: 'ID del usuario supervisor o responsable de la rendición' })
  @Column({ name: 'responsable_id', type: 'int' })
  responsable_id: number;

  // Dupla de becarios encargados
  @ApiPropertyOptional({ example: 4, description: 'ID del primer becario encargado de la dupla' })
  @Column({ name: 'becario_encargado_1_id', type: 'int', nullable: true })
  becario_encargado_1_id: number | null;

  @ApiPropertyOptional({ example: 'Nilda Amalia Churata Paye', description: 'Nombre del primer becario encargado' })
  @Column({ name: 'becario_encargado_1_nombre', type: 'varchar', length: 150, nullable: true })
  becario_encargado_1_nombre: string | null;

  @ApiPropertyOptional({ example: 5, description: 'ID del segundo becario encargado de la dupla' })
  @Column({ name: 'becario_encargado_2_id', type: 'int', nullable: true })
  becario_encargado_2_id: number | null;

  @ApiPropertyOptional({ example: 'Joel Mamani Quispe', description: 'Nombre del segundo becario encargado' })
  @Column({ name: 'becario_encargado_2_nombre', type: 'varchar', length: 150, nullable: true })
  becario_encargado_2_nombre: string | null;

  // Compatibilidad con registros antiguos (encargado único previo)
  @ApiPropertyOptional({ example: 4, description: 'ID del becario encargado principal (compatibilidad)' })
  @Column({ name: 'becario_id', type: 'int', nullable: true })
  becario_id: number | null;

  @ApiPropertyOptional({ example: 'Nilda Amalia Churata Paye', description: 'Nombre del becario encargado (compatibilidad)' })
  @Column({ name: 'becario_nombre', type: 'varchar', length: 150, nullable: true })
  becario_nombre: string | null;

  @ApiProperty({
    example: 'cocina_diaconia',
    description: 'Modalidad de preparación del refrigerio: cocina_diaconia | traido_de_casa | compra_directa',
  })
  @Column({ name: 'modalidad_preparacion', type: 'varchar', length: 50, default: 'cocina_diaconia' })
  modalidad_preparacion: string;

  @ApiPropertyOptional({
    description: 'Detalle desglosado de ingredientes e insumos adquiridos por la dupla',
    example: [
      { insumo: 'Pan surtido', cantidad: '25 unidades', costo_bs: 20.0, pagado_por_becario_id: 4, pagado_por_nombre: 'Nilda Churata' },
      { insumo: 'Huevos y queso', cantidad: '1 maple y 1 queso', costo_bs: 60.0, pagado_por_becario_id: 5, pagado_por_nombre: 'Joel Mamani' },
    ],
  })
  @Column({ name: 'detalle_ingredientes', type: 'jsonb', nullable: true })
  detalle_ingredientes: DetalleIngredienteRefrigerio[] | null;

  @ApiProperty({ example: 138.0, description: 'Presupuesto referencial en bolivianos (23 raciones x Bs 6)' })
  @Column({ name: 'presupuesto_referencial_bs', type: 'decimal', precision: 10, scale: 2, default: 138.0 })
  presupuesto_referencial_bs: number;

  @ApiProperty({ example: 100.0, description: 'Porcentaje de devolución institucional (100% de reembolso íntegro)' })
  @Column({ name: 'porcentaje_devolucion', type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  porcentaje_devolucion: number;

  @ApiProperty({ example: 138.0, description: 'Monto total a devolver en bolivianos (100% del gasto rendido)' })
  @Column({ name: 'monto_devolucion_bs', type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  monto_devolucion_bs: number;

  @ApiPropertyOptional({ example: 4, description: 'ID del único becario de la dupla que recibió físicamente el reembolso del 100%' })
  @Column({ name: 'becario_receptor_devolucion_id', type: 'int', nullable: true })
  becario_receptor_devolucion_id: number | null;

  @ApiPropertyOptional({ example: 'Nilda Amalia Churata Paye', description: 'Nombre del becario receptor único del reembolso' })
  @Column({ name: 'becario_receptor_devolucion_nombre', type: 'varchar', length: 150, nullable: true })
  becario_receptor_devolucion_nombre: string | null;

  @ApiPropertyOptional({ example: '2026-10-12T15:00:00Z', description: 'Fecha y hora en que se entregó la devolución' })
  @Column({ name: 'fecha_entrega_devolucion', type: 'timestamp', nullable: true })
  fecha_entrega_devolucion: Date | null;

  @ApiPropertyOptional({ example: 2, description: 'ID del usuario administrador que efectuó la entrega del reembolso' })
  @Column({ name: 'entregado_por_usuario_id', type: 'int', nullable: true })
  entregado_por_usuario_id: number | null;

  @ApiProperty({
    example: 'sorteado_programado',
    description: 'Estado de la reposición: sorteado_programado | rendido_pendiente | revisado_supervisor | aprobado_administracion',
  })
  @Column({ name: 'estado_reposicion', type: 'varchar', length: 50, default: 'sorteado_programado' })
  estado_reposicion: string;

  // Trazabilidad de revisión por supervisor
  @ApiPropertyOptional({ example: 3, description: 'ID del supervisor que revisó la rendición' })
  @Column({ name: 'revisado_por_supervisor_id', type: 'int', nullable: true })
  revisado_por_supervisor_id: number | null;

  @ApiPropertyOptional({ description: 'Fecha y hora de revisión por el supervisor' })
  @Column({ name: 'fecha_revision_supervisor', type: 'timestamp', nullable: true })
  fecha_revision_supervisor: Date | null;

  @ApiPropertyOptional({ description: 'Observación o conformidad del supervisor' })
  @Column({ name: 'observacion_supervisor', type: 'text', nullable: true })
  observacion_supervisor: string | null;

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
