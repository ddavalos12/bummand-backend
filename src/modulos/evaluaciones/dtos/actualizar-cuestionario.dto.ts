import { PartialType } from '@nestjs/swagger';
import { CrearCuestionarioDto } from './crear-cuestionario.dto';

export class ActualizarCuestionarioDto extends PartialType(CrearCuestionarioDto) {}
