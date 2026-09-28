import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { IglesiasServicio } from './iglesias.servicio';
import { CrearIglesiaDto } from './dtos/crear-iglesia.dto';
import { ActualizarIglesiaDto } from './dtos/actualizar-iglesia.dto';
import { Iglesia } from './entidades/iglesia.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol } from '../usuarios/entidades/usuario.entidad';

@Controller('iglesias')
@UseGuards(JwtGuardia, RolesGuardia)
export class IglesiasControlador {
  constructor(private readonly servicio: IglesiasServicio) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  crear(@Body() dto: CrearIglesiaDto): Promise<Iglesia> {
    return this.servicio.crear(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  listar(): Promise<Iglesia[]> {
    return this.servicio.listar();
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  obtener(@Param('id', ParseIntPipe) id: number): Promise<Iglesia> {
    return this.servicio.obtener(id);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarIglesiaDto,
  ): Promise<Iglesia> {
    return this.servicio.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.servicio.eliminar(id);
  }
}
