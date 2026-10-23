import { PartialType } from '@nestjs/swagger';
import { CrearPreguntaCuestionarioDto } from './crear-pregunta-cuestionario.dto';

export class ActualizarPreguntaCuestionarioDto extends PartialType(CrearPreguntaCuestionarioDto) {}
