import { PartialType } from '@nestjs/swagger';
import { CrearBecarioDto } from './crear-becario.dto';

export class ActualizarBecarioDto extends PartialType(CrearBecarioDto) {}
