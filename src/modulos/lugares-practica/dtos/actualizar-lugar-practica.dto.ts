import { PartialType } from '@nestjs/swagger';
import { CrearLugarPracticaDto } from './crear-lugar-practica.dto';

export class ActualizarLugarPracticaDto extends PartialType(CrearLugarPracticaDto) {}
