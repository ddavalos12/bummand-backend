import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearIglesiaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;
}
