import { Controller, Get, Post, Body, Param, Put, UseGuards, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuariosServicio } from './usuarios.servicio';
import { CrearUsuarioDto } from './dtos/crear-usuario.dto';
import { Usuario, Rol, EstadoUsuario } from './entidades/usuario.entidad';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';

@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@Controller('usuarios')
@UseGuards(JwtGuardia, RolesGuardia)
export class UsuariosControlador {
  constructor(private readonly usuariosServicio: UsuariosServicio) {}

  @Post()
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Crear usuario institucional',
    description: 'Registra un nuevo usuario con rol de administrador o supervisor. (Exclusivo para Administradores).',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente.',
    type: Usuario,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el correo ya se encuentra registrado.',
  })
  @ApiResponse({ status: 403, description: 'Acceso denegado por falta de privilegios (requiere Administrador).' })
  crear(@Body() crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
    return this.usuariosServicio.crear(crearUsuarioDto);
  }

  @Get()
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Listar usuarios institucionales',
    description: 'Retorna el catálogo de usuarios, opcionalmente filtrados por rol institucional.',
  })
  @ApiQuery({
    name: 'rol',
    required: false,
    enum: Rol,
    description: 'Filtro opcional por rol institucional (administrador, supervisor, becario)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de usuarios recuperado satisfactoriamente.',
    type: [Usuario],
  })
  @ApiResponse({ status: 400, description: 'Rol especificado inválido.' })
  listar(@Query('rol') rol?: string): Promise<Usuario[]> {
    if (rol && !Object.values(Rol).includes(rol as Rol)) {
      throw new BadRequestException('Rol inválido');
    }
    return this.usuariosServicio.listar(rol as Rol);
  }

  @Put(':id/estado')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Cambiar estado de cuenta de usuario',
    description: 'Activa o desactiva la cuenta institucional de un usuario. Un administrador no puede auto-desactivarse.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del usuario',
    type: Number,
    example: 3,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          enum: Object.values(EstadoUsuario),
          example: 'inactivo',
          description: 'Nuevo estado de la cuenta institucional (activo o inactivo)',
        },
      },
      required: ['estado'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la cuenta actualizado satisfactoriamente.',
    type: Usuario,
  })
  @ApiResponse({ status: 400, description: 'Estado inválido o intento de auto-desactivación de la cuenta propia.' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: EstadoUsuario,
    @UsuarioActual() usuarioAutenticado: Usuario
  ): Promise<Usuario> {
    if (!Object.values(EstadoUsuario).includes(estado)) {
      throw new BadRequestException('Estado debe ser activo o inactivo');
    }
    if (id === usuarioAutenticado.id && estado === EstadoUsuario.INACTIVO) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }
    return this.usuariosServicio.cambiarEstado(id, estado);
  }
}
