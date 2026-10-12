import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AsignarSupervisorDto {
  @ApiProperty({ example: 2, description: 'Identificador del supervisor asignado' })
  @IsNotEmpty()
  @IsNumber()
  supervisor_id: number;
}
