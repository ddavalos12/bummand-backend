import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Becario } from './becario.entidad';
import { PeriodoEvaluacion } from '../../evaluaciones/entidades/periodo-evaluacion.entidad';

export enum TipoDocumentoSemestral {
  KARDEX = 'kardex',
  PROGRAMACION_NUEVA = 'programacion_nueva',
  CARNET_IDENTIDAD = 'carnet_identidad',
  OTRO = 'otro',
}

export enum EstadoDocumentoSemestral {
  EN_REVISION = 'en_revision',
  CONVALIDADO = 'convalidado',
  OBSERVADO = 'observado',
}

@Entity('documentos_semestrales_becarios')
export class DocumentoSemestralBecario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'becario_id' })
  becario_id: number;

  @Column({ name: 'periodo_id' })
  periodo_id: number;

  @Column({
    type: 'enum',
    enum: TipoDocumentoSemestral,
    name: 'tipo_documento',
  })
  tipo_documento: TipoDocumentoSemestral;

  @Column({ name: 'url_archivo', type: 'text' })
  url_archivo: string;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255 })
  nombre_archivo: string;

  @Column({ name: 'tamano_archivo', type: 'varchar', length: 50, nullable: true })
  tamano_archivo: string | null;

  @Column({
    type: 'enum',
    enum: EstadoDocumentoSemestral,
    default: EstadoDocumentoSemestral.EN_REVISION,
  })
  estado: EstadoDocumentoSemestral;

  @Column({ type: 'text', nullable: true })
  observacion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Becario, (becario) => becario.documentos_semestrales, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'becario_id' })
  becario: Becario;

  @ManyToOne(() => PeriodoEvaluacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'periodo_id' })
  periodo: PeriodoEvaluacion;
}
