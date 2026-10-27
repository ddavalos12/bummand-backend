import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, MaxLength, IsDateString, IsObject } from 'class-validator';

export class CrearBecarioDto {
  @ApiProperty({
    example: '10028341',
    description: 'Cédula de identidad (C.I.) del becario registrada por la administración',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ci: string;

  @ApiProperty({
    example: 'Nilda Churata Quispe',
    description: 'Nombre completo del becario',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({
    example: 'nilda.churata@diaconia.bo',
    description: 'Correo electrónico del becario (opcional en alta inicial, el becario puede definirlo desde la app)',
    maxLength: 150,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  correo?: string;

  @ApiPropertyOptional({
    example: 'ClaveSegura123*',
    description: 'Contraseña para la cuenta del becario (opcional si el becario se registra desde el móvil)',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  contrasena?: string;

  @ApiProperty({
    example: 'Ingeniería de Sistemas',
    description: 'Carrera universitaria que cursa el becario',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  carrera: string;

  @ApiProperty({
    example: 'Universidad Mayor de San Andrés',
    description: 'Universidad donde estudia el becario',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  universidad: string;

  @ApiPropertyOptional({
    example: 'Fundación Diaconía FRIF-IFD',
    description: 'Institución donde realiza las prácticas',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  institucion?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador de la iglesia asignada',
  })
  @IsOptional()
  @IsNumber()
  iglesia_id?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del lugar de práctica asignado',
  })
  @IsOptional()
  @IsNumber()
  lugar_practica_id?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Identificador del usuario supervisor asignado',
  })
  @IsOptional()
  @IsNumber()
  supervisor_id?: number;

  @ApiPropertyOptional({
    example: 'Seguridad Física',
    description: 'Unidad o área funcional asignada en la institución',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  unidad?: string;

  @ApiPropertyOptional({
    example: '2026-02-01',
    description: 'Fecha de ingreso al programa BUMAND (formato YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  fecha_ingreso?: string;

  @ApiPropertyOptional({
    example: 'LP',
    description: 'Extensión oficial del departamento emisor del C.I. según SEGIP Bolivia (LP, SC, CB, OR, PT, TJ, CH, BN, PA, QR)',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  lugar_expedicion?: string;

  @ApiPropertyOptional({
    example: '71234567',
    description: 'Número de teléfono celular de contacto',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  celular?: string;

  @ApiPropertyOptional({
    example: 'Soltero(a)',
    description: 'Estado civil del becario',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  estado_civil?: string;

  @ApiPropertyOptional({
    example: 'F',
    description: 'Sexo o género del becario (M o F)',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  sexo?: string;

  @ApiPropertyOptional({
    example: '2003-05-14',
    description: 'Fecha de nacimiento (formato YYYY-MM-DD)',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  fecha_nacimiento?: string;

  @ApiPropertyOptional({
    example: 'Zona Villa Adela, Calle 4 #102',
    description: 'Dirección o domicilio registrado',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @ApiPropertyOptional({
    example: 'El Alto',
    description: 'Ciudad de residencia',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ciudad?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Nivel CETI cursado',
  })
  @IsOptional()
  @IsNumber()
  ceti?: number;

  @ApiPropertyOptional({
    example: { lun: '08:00-12:00', mar: '', mie: '08:00-12:00', jue: '', vie: '08:00-14:00', sab: '', dom: '' },
    description: 'Matriz semanal de horarios asignados de prácticas (Lunes a Domingo)',
  })
  @IsOptional()
  @IsObject()
  horario_semanal?: Record<string, string>;

  @ApiPropertyOptional({
    example: 'data:application/pdf;base64,...',
    description: 'URL o Data URL del Carnet de Identidad oficial del becario',
  })
  @IsOptional()
  @IsString()
  url_carnet?: string;

  @ApiPropertyOptional({
    example: 'data:application/pdf;base64,...',
    description: 'URL o Data URL de la matrícula universitaria o kárdex de notas',
  })
  @IsOptional()
  @IsString()
  url_kardex?: string;
}
