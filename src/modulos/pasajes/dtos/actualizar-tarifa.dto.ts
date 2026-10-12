import { PartialType } from '@nestjs/swagger';
import { CrearTarifaDto } from './crear-tarifa.dto';

export class ActualizarTarifaDto extends PartialType(CrearTarifaDto) {}
