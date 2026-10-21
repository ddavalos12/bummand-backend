import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from '../../usuarios/entidades/usuario.entidad';
import { Iglesia } from '../../iglesias/entidades/iglesia.entidad';
import { LugarPractica } from '../../lugares-practica/entidades/lugar-practica.entidad';
import { RegistroAsistencia } from '../../asistencia/entidades/registro-asistencia.entidad';
import { SolicitudPasajes } from '../../pasajes/entidades/solicitud-pasaje.entidad';
import { Evaluacion } from '../../evaluaciones/entidades/evaluacion.entidad';
import { AprobacionPracticas } from '../../practicas/entidades/aprobacion-practicas.entidad';
import { ReporteGenerado } from '../../pdf/entidades/reporte-generado.entidad';
import { HorarioApoyo } from './horario-apoyo.entidad';
import { AsignacionPractica } from './asignacion-practica.entidad';

@Entity('becarios')
export class Becario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'int', unique: true, nullable: true })
  usuario_id: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  nombre: string | null;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  ci: string | null;

  @Column({ type: 'varchar', length: 100 })
  carrera: string;

  @Column({ type: 'varchar', length: 150 })
  universidad: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  institucion: string | null;

  @Column({ name: 'iglesia_id', type: 'int', nullable: true })
  iglesia_id: number | null;

  @Column({ name: 'lugar_practica_id', type: 'int', nullable: true })
  lugar_practica_id: number | null;

  @Column({ name: 'fecha_ingreso', type: 'date' })
  fecha_ingreso: Date;

  @Column({ name: 'supervisor_id', type: 'int', nullable: true })
  supervisor_id: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unidad: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ubicacion: string | null;

  @Column({ name: 'lugar_expedicion', type: 'varchar', length: 30, nullable: true })
  lugar_expedicion: string | null;

  @Column({ name: 'estado_civil', type: 'varchar', length: 30, nullable: true })
  estado_civil: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  sexo: string | null;

  @Column({ type: 'int', nullable: true })
  ceti: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  celular: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'varchar', length: 30, nullable: true })
  fecha_nacimiento: string | null;

  @Column({ type: 'int', nullable: true })
  edad: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  ciudad: string | null;

  @Column({ name: 'horario_semanal', type: 'jsonb', nullable: true })
  horario_semanal: Record<string, string> | null;

  @Column({ name: 'datos_confirmados', type: 'boolean', default: false })
  datos_confirmados: boolean;

  @Column({ name: 'datos_validados', type: 'boolean', default: false })
  datos_validados: boolean;

  @Column({ name: 'fecha_ultima_confirmacion', type: 'timestamp', nullable: true })
  fecha_ultima_confirmacion: Date | null;

  @Column({ name: 'modalidad_carrera', type: 'varchar', length: 50, nullable: true })
  modalidad_carrera: string | null;

  @Column({ name: 'tipo_beca', type: 'varchar', length: 50, nullable: true })
  tipo_beca: string | null;

  @Column({ name: 'comentario_academico', type: 'text', nullable: true })
  comentario_academico: string | null;

  @Column({ name: 'comentario_iglesia', type: 'text', nullable: true })
  comentario_iglesia: string | null;

  @OneToOne(() => Usuario, (usuario) => usuario.becario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  @ManyToOne(() => Usuario, (usuario) => usuario.becarios_supervisados, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario | null;

  @ManyToOne(() => Iglesia, (iglesia) => iglesia.becarios)
  @JoinColumn({ name: 'iglesia_id' })
  iglesia: Iglesia | null;

  @ManyToOne(() => LugarPractica, (lugar_practica) => lugar_practica.becarios)
  @JoinColumn({ name: 'lugar_practica_id' })
  lugar_practica: LugarPractica | null;

  @OneToMany(() => RegistroAsistencia, (registro) => registro.becario)
  registros_asistencia: RegistroAsistencia[];

  @OneToMany(() => SolicitudPasajes, (solicitud) => solicitud.becario)
  solicitudes_pasajes: SolicitudPasajes[];

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.becario)
  evaluaciones: Evaluacion[];

  @OneToMany(() => AprobacionPracticas, (aprobacion) => aprobacion.becario)
  aprobaciones_practicas: AprobacionPracticas[];

  @OneToMany(() => ReporteGenerado, (reporte) => reporte.becario)
  reportes_generados: ReporteGenerado[];

  @OneToMany(() => HorarioApoyo, (horario) => horario.becario)
  horarios_apoyo: HorarioApoyo[];

  @OneToMany(() => AsignacionPractica, (asignacion) => asignacion.becario)
  asignaciones_practica: AsignacionPractica[];
}
