import { PartialType } from '@nestjs/mapped-types';
import { CrearIglesiaDto } from './crear-iglesia.dto';

export class ActualizarIglesiaDto extends PartialType(CrearIglesiaDto) {}
