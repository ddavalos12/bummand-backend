import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CrearIglesiaDto {
  @ApiProperty({
    example: 'Iglesia Central El Alto',
    description: 'Nombre de la congregación o iglesia cristiana',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;
}
