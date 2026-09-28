import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { BecariosServicio } from './becarios.servicio';
import { CrearBecarioDto } from './dtos/crear-becario.dto';
import { ActualizarBecarioDto } from './dtos/actualizar-becario.dto';
import { Becario } from './entidades/becario.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';

@Controller('becarios')
@UseGuards(JwtGuardia, RolesGuardia)
export class BecariosControlador {
  constructor(private readonly becariosServicio: BecariosServicio) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  crear(@Body() dto: CrearBecarioDto): Promise<Becario> {
    return this.becariosServicio.crear(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  listar(@UsuarioActual() usuarioAutenticado: Usuario): Promise<Becario[]> {
    // Si es supervisor, la lógica interna lo filtrará por los suyos
    return this.becariosServicio.listar(usuarioAutenticado);
  }

  @Get('me')
  @Roles(Rol.BECARIO)
  async perfilPropio(@UsuarioActual() usuarioAutenticado: Usuario): Promise<Becario> {
    const becario = await this.becariosServicio.obtenerPorUsuario(usuarioAutenticado.id);
    if (!becario) throw new NotFoundException('Perfil de becario no encontrado');
    return becario;
  }

  @Put('me')
  @Roles(Rol.BECARIO)
  async actualizarPerfilPropio(
    @UsuarioActual() usuarioAutenticado: Usuario,
    @Body('universidad') universidad: string,
  ): Promise<Becario> {
    if (!universidad || universidad.length < 2 || universidad.length > 150) {
      throw new BadRequestException('La universidad debe tener entre 2 y 150 caracteres');
    }
    const becario = await this.becariosServicio.obtenerPorUsuario(usuarioAutenticado.id);
    if (!becario) throw new NotFoundException('Perfil de becario no encontrado');
    
    return this.becariosServicio.actualizar(becario.id, { universidad });
  }

  @Get(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  obtener(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuarioAutenticado: Usuario
  ): Promise<Becario> {
    return this.becariosServicio.obtener(id, usuarioAutenticado);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarBecarioDto
  ): Promise<Becario> {
    return this.becariosServicio.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.becariosServicio.eliminar(id);
  }
}
