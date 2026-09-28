import { PartialType } from '@nestjs/mapped-types';
import { CrearLugarPracticaDto } from './crear-lugar-practica.dto';

export class ActualizarLugarPracticaDto extends PartialType(CrearLugarPracticaDto) {}
