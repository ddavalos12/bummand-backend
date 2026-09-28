import { PartialType } from '@nestjs/mapped-types';
import { CrearBecarioDto } from './crear-becario.dto';

export class ActualizarBecarioDto extends PartialType(CrearBecarioDto) {}
