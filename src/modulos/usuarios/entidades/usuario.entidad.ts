import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';

export enum Rol {
  BECARIO = 'becario',
  SUPERVISOR = 'supervisor',
  ADMINISTRADOR = 'administrador',
}

export enum EstadoUsuario {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo: string;

  @Column({ name: 'contrasena_hash', type: 'varchar', length: 255 })
  contrasenaHash: string;

  @Column({ type: 'enum', enum: Rol })
  rol: Rol;

  @Column({ type: 'enum', enum: EstadoUsuario, default: EstadoUsuario.ACTIVO })
  estado: EstadoUsuario;

  @Column({ name: 'fcm_token', type: 'varchar', length: 255, nullable: true })
  fcmToken: string;

  @Column({ name: 'reset_codigo', type: 'varchar', length: 10, nullable: true })
  resetCodigo: string;

  @Column({ name: 'reset_expira', type: 'timestamp', nullable: true })
  resetExpira: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => Becario, (becario) => becario.usuario)
  becario: Becario;

  @OneToMany(() => Becario, (becario) => becario.supervisor)
  becariosSupervisados: Becario[];
}
