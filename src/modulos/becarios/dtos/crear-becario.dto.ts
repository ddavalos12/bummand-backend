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
  iglesiaId?: number;

  @IsOptional()
  @IsNumber()
  lugarPracticaId?: number;

  @IsOptional()
  @IsNumber()
  supervisorId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  unidad?: string;

  @IsDateString()
  @IsNotEmpty()
  fechaIngreso: string;
}
