import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RetroalimentarDevocionalDto {
  @ApiProperty({
    example: 'Hermano, Dios bendiga tu tiempo devocional. Muy acertada la aplicación a tu práctica diaria.',
    description: 'Comentario pastoral u observación espiritual del pastor o mentor',
  })
  @IsNotEmpty()
  @IsString()
  comentario_pastoral: string;
}
