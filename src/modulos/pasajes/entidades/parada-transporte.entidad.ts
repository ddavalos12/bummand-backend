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

export const PARADAS_OFICIALES_DEFECTO: Partial<ParadaTransporte>[] = [
  {
    nombre: 'La Ceja - Calle 1',
    zona: 'Ceja',
    ciudad: 'El Alto',
    latitud: -16.5085,
    longitud: -68.1633,
    tipo_transporte: 'Minibús / Micro',
    tarifa_referencial: 2.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Cruce Viacha',
    zona: 'Cruce Viacha',
    ciudad: 'El Alto',
    latitud: -16.5350,
    longitud: -68.1750,
    tipo_transporte: 'Minibús / Micro',
    tarifa_referencial: 2.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Pérez Velasco',
    zona: 'Centro',
    ciudad: 'La Paz',
    latitud: -16.4955,
    longitud: -68.1370,
    tipo_transporte: 'Minibús / Micro / Bus Pumakatari',
    tarifa_referencial: 2.60,
    es_nodo_principal: true,
  },
  {
    nombre: 'Plaza San Francisco',
    zona: 'Centro / Rosario',
    ciudad: 'La Paz',
    latitud: -16.4962,
    longitud: -68.1384,
    tipo_transporte: 'Minibús / Trufi',
    tarifa_referencial: 2.60,
    es_nodo_principal: true,
  },
  {
    nombre: 'San Pedro - Plaza Sucre',
    zona: 'San Pedro',
    ciudad: 'La Paz',
    latitud: -16.5020,
    longitud: -68.1375,
    tipo_transporte: 'Minibús / Trufi',
    tarifa_referencial: 2.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Sopocachi - Plaza Abaroa',
    zona: 'Sopocachi',
    ciudad: 'La Paz',
    latitud: -16.5125,
    longitud: -68.1275,
    tipo_transporte: 'Minibús / Trufi',
    tarifa_referencial: 2.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Miraflores - Estadio Hernando Siles',
    zona: 'Miraflores',
    ciudad: 'La Paz',
    latitud: -16.5005,
    longitud: -68.1228,
    tipo_transporte: 'Minibús / Trufi / PumaKatari',
    tarifa_referencial: 2.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Plaza Triangular',
    zona: 'Miraflores',
    ciudad: 'La Paz',
    latitud: -16.5080,
    longitud: -68.1195,
    tipo_transporte: 'Minibús / Teleférico Blanco',
    tarifa_referencial: 2.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Villa Fátima - Plaza del Maestro',
    zona: 'Villa Fátima',
    ciudad: 'La Paz',
    latitud: -16.4795,
    longitud: -68.1180,
    tipo_transporte: 'Minibús / Bus Yungueño',
    tarifa_referencial: 2.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Estación Teleférico Rojo (Central / 16 de Julio)',
    zona: 'Zona Norte / 16 de Julio',
    ciudad: 'La Paz',
    latitud: -16.4910,
    longitud: -68.1430,
    tipo_transporte: 'Mi Teleférico',
    tarifa_referencial: 3.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Estación Teleférico Amarillo (Ciudad Satélite / Mirador)',
    zona: 'Ciudad Satélite',
    ciudad: 'El Alto',
    latitud: -16.5190,
    longitud: -68.1465,
    tipo_transporte: 'Mi Teleférico',
    tarifa_referencial: 3.00,
    es_nodo_principal: true,
  },
  {
    nombre: 'Estación Teleférico Morado (Faro Murillo / Obelisco)',
    zona: 'Faro Murillo',
    ciudad: 'El Alto',
    latitud: -16.5115,
    longitud: -68.1565,
    tipo_transporte: 'Mi Teleférico',
    tarifa_referencial: 3.00,
    es_nodo_principal: true,
  },
];

