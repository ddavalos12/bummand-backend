import { PartialType } from '@nestjs/swagger';
import { CrearRefrigerioDto } from './crear-refrigerio.dto';

export class ActualizarRefrigerioDto extends PartialType(CrearRefrigerioDto) {}
