import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PasajesServicio } from './pasajes.servicio';
import { SolicitudPasajes } from './entidades/solicitud-pasaje.entidad';
import { CrearSolicitudPasajeDto } from './dtos/crear-solicitud-pasaje.dto';
import { AgregarRecorridoDto } from './dtos/agregar-recorrido.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

@UseGuards(JwtGuardia, RolesGuardia)
@Controller('pasajes')
export class PasajesControlador {
  constructor(private readonly pasajesServicio: PasajesServicio) {}

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post()
  crear(@Body() crearSolicitudPasajeDto: CrearSolicitudPasajeDto, @UsuarioActual() usuario: Usuario): Promise<SolicitudPasajes> {
    crearSolicitudPasajeDto.becario_id = usuario.id;
    return this.pasajesServicio.crear(crearSolicitudPasajeDto);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post('recorridos')
  agregarRecorrido(@Body() agregarRecorridoDto: AgregarRecorridoDto, @UsuarioActual() usuario: Usuario) {
    agregarRecorridoDto.becario_id = usuario.id;
    return this.pasajesServicio.agregarRecorrido(agregarRecorridoDto);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get()
  obtenerTodas(): Promise<SolicitudPasajes[]> {
    return this.pasajesServicio.obtenerTodas();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<SolicitudPasajes> {
    return this.pasajesServicio.obtenerPorId(id);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('becario/:becario_id')
  obtenerPorBecario(@Param('becario_id', ParseIntPipe) becario_id: number): Promise<SolicitudPasajes[]> {
    return this.pasajesServicio.obtenerPorBecario(becario_id);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post(':id/enviar')
  enviarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ): Promise<SolicitudPasajes> {
    return this.pasajesServicio.enviarSolicitud(id, usuario.id);
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Patch(':id/enviar')
  enviarSolicitudPatch(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ): Promise<SolicitudPasajes> {
    return this.pasajesServicio.enviarSolicitud(id, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/aprobar')
  aprobarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ): Promise<SolicitudPasajes> {
    return this.pasajesServicio.aprobarSolicitud(id, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/rechazar')
  rechazarSolicitud(
    @Param('id', ParseIntPipe) id: number,
    @Body('observaciones') observaciones: string,
    @UsuarioActual() usuario: Usuario,
  ): Promise<SolicitudPasajes> {
    return this.pasajesServicio.rechazarSolicitud(id, usuario.id, observaciones);
  }
}
