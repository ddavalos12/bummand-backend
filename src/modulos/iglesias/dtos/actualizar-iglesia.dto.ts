import { PartialType } from '@nestjs/swagger';
import { CrearIglesiaDto } from './crear-iglesia.dto';

export class ActualizarIglesiaDto extends PartialType(CrearIglesiaDto) {}
