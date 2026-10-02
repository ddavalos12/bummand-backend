import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BecariosServicio } from './becarios.servicio';
import { CrearBecarioDto } from './dtos/crear-becario.dto';
import { ActualizarBecarioDto } from './dtos/actualizar-becario.dto';
import { Becario } from './entidades/becario.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';

@ApiTags('Becarios')
@ApiBearerAuth('JWT-auth')
@Controller('becarios')
@UseGuards(JwtGuardia, RolesGuardia)
export class BecariosControlador {
  constructor(private readonly becariosServicio: BecariosServicio) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Registrar nuevo becario institucional',
    description: 'Crea la cuenta de usuario y el expediente académico-institucional del becario.',
  })
  @ApiResponse({ status: 201, description: 'Becario registrado con éxito.', type: Becario })
  @ApiResponse({ status: 400, description: 'Datos inválidos o inconsistentes.' })
  crear(@Body() dto: CrearBecarioDto): Promise<Becario> {
    return this.becariosServicio.crear(dto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Listar becarios',
    description: 'Retorna los becarios. Si quien consulta es supervisor, filtra automáticamente a los becarios bajo su tutela.',
  })
  @ApiResponse({ status: 200, description: 'Directorio de becarios obtenido.', type: [Becario] })
  listar(@UsuarioActual() usuarioAutenticado: Usuario): Promise<Becario[]> {
    return this.becariosServicio.listar(usuarioAutenticado);
  }

  @Get('me')
  @Roles(Rol.BECARIO)
  @ApiOperation({
    summary: 'Obtener perfil del becario autenticado',
    description: 'Retorna el expediente completo del becario autenticado que realiza la petición.',
  })
  @ApiResponse({ status: 200, description: 'Perfil recuperado con éxito.', type: Becario })
  @ApiResponse({ status: 404, description: 'Perfil de becario no encontrado.' })
  async perfilPropio(@UsuarioActual() usuarioAutenticado: Usuario): Promise<Becario> {
    const becario = await this.becariosServicio.obtenerPorUsuario(usuarioAutenticado.id);
    if (!becario) throw new NotFoundException('Perfil de becario no encontrado');
    return becario;
  }

  @Put('me')
  @Roles(Rol.BECARIO)
  @ApiOperation({
    summary: 'Actualizar universidad del perfil propio',
    description: 'Permite al becario autenticado actualizar los datos de su universidad.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        universidad: {
          type: 'string',
          example: 'Universidad Mayor de San Andrés',
          description: 'Nombre actualizado de la universidad',
        },
      },
      required: ['universidad'],
    },
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado.', type: Becario })
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
  @ApiOperation({
    summary: 'Obtener becario por ID',
    description: 'Consulta los detalles institucionales de un becario por su identificador primario.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle del becario encontrado.', type: Becario })
  @ApiResponse({ status: 404, description: 'Becario no encontrado o fuera de la jurisdicción del supervisor.' })
  obtener(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuarioAutenticado: Usuario
  ): Promise<Becario> {
    return this.becariosServicio.obtener(id, usuarioAutenticado);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar expediente de becario',
    description: 'Modifica los datos académicos o asignaciones institucionales de un becario (Solo Administradores).',
  })
  @ApiParam({ name: 'id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Becario actualizado.', type: Becario })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarBecarioDto
  ): Promise<Becario> {
    return this.becariosServicio.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Dar de baja a un becario',
    description: 'Desactiva lógicamente el perfil de un becario y su usuario asociado.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Becario eliminado satisfactoriamente.' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.becariosServicio.eliminar(id);
  }
}
