import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LugaresPracticaServicio } from './lugares-practica.servicio';
import { CrearLugarPracticaDto } from './dtos/crear-lugar-practica.dto';
import { ActualizarLugarPracticaDto } from './dtos/actualizar-lugar-practica.dto';
import { LugarPractica } from './entidades/lugar-practica.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@Controller('lugares-practica')
@UseGuards(JwtGuardia, RolesGuardia)
export class LugaresPracticaControlador {
  constructor(private readonly servicio: LugaresPracticaServicio) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  crear(@Body() dto: CrearLugarPracticaDto): Promise<LugarPractica> {
    return this.servicio.crear(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  listar(): Promise<LugarPractica[]> {
    return this.servicio.listar();
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  obtener(@Param('id', ParseIntPipe) id: number): Promise<LugarPractica> {
    return this.servicio.obtener(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarLugarPracticaDto,
  ): Promise<LugarPractica> {
    return this.servicio.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.servicio.eliminar(id);
  }
}
