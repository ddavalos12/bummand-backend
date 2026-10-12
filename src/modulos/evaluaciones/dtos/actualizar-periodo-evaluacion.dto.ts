import { PartialType } from '@nestjs/swagger';
import { CrearPeriodoEvaluacionDto } from './crear-periodo-evaluacion.dto';

export class ActualizarPeriodoEvaluacionDto extends PartialType(CrearPeriodoEvaluacionDto) {}
