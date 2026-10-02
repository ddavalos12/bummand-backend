import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Becario } from '../../becarios/entidades/becario.entidad';
import { Notificacion } from '../../notificaciones/entidades/notificacion.entidad';

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
  contrasena_hash: string;

  @Column({ type: 'enum', enum: Rol })
  rol: Rol;

  @Column({ type: 'enum', enum: EstadoUsuario, default: EstadoUsuario.ACTIVO })
  estado: EstadoUsuario;

  @Column({ name: 'fcm_token', type: 'varchar', length: 255, nullable: true })
  fcm_token: string;

  @Column({ name: 'reset_codigo', type: 'varchar', length: 10, nullable: true })
  reset_codigo: string;

  @Column({ name: 'reset_expira', type: 'timestamp', nullable: true })
  reset_expira: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Alias para compatibilidad
  get contrasenaHash(): string {
    return this.contrasena_hash;
  }
  set contrasenaHash(valor: string) {
    this.contrasena_hash = valor;
  }

  get fcmToken(): string {
    return this.fcm_token;
  }
  set fcmToken(valor: string) {
    this.fcm_token = valor;
  }

  get createdAt(): Date {
    return this.created_at;
  }
  set createdAt(valor: Date) {
    this.created_at = valor;
  }

  @OneToOne(() => Becario, (becario) => becario.usuario)
  becario: Becario;

  @OneToMany(() => Becario, (becario) => becario.supervisor)
  becarios_supervisados: Becario[];

  @OneToMany(() => Notificacion, (notificacion) => notificacion.usuario)
  notificaciones: Notificacion[];
}

