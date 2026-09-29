import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, MaxLength, IsDateString } from 'class-validator';

export class CrearBecarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  correo: string;

  @IsString()
  @MinLength(6)
  contrasena: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  carrera: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  universidad: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  institucion?: string;

  @IsOptional()
  @IsNumber()
  iglesia_id?: number;

  @IsOptional()
  @IsNumber()
  lugar_practica_id?: number;

  @IsOptional()
  @IsNumber()
  supervisor_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  unidad?: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_ingreso: string;
}

