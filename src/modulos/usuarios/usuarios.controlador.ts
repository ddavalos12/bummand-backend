import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Put,
  UseGuards,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
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

  @Get('mi-perfil/correos')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Listar correos del usuario autenticado',
    description: 'Retorna el correo principal, correo alternativo y la lista de correos adicionales vinculados para inicio de sesión.',
  })
  listarMisCorreos(@UsuarioActual() usuarioAutenticado: Usuario) {
    return this.usuariosServicio.listarCorreosUsuario(usuarioAutenticado.id);
  }

  @Post('mi-perfil/correos')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Agregar un correo alternativo para inicio de sesión',
    description: 'Registra un nuevo correo adicional en correos_usuarios validando unicidad global.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        correo: { type: 'string', example: 'alternativo@gmail.com' },
        etiqueta: { type: 'string', example: 'Personal' },
      },
      required: ['correo'],
    },
  })
  agregarMiCorreo(
    @UsuarioActual() usuarioAutenticado: Usuario,
    @Body() cuerpo: { correo: string; etiqueta?: string },
  ) {
    if (!cuerpo || !cuerpo.correo) {
      throw new BadRequestException('Debe especificar el correo electrónico a vincular.');
    }
    return this.usuariosServicio.agregarCorreoAlternativo(
      usuarioAutenticado.id,
      cuerpo.correo,
      cuerpo.etiqueta,
    );
  }

  @Delete('mi-perfil/correos/:correo_id')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Eliminar un correo alternativo vinculado',
    description: 'Desvincula un correo adicional de la cuenta del usuario autenticado.',
  })
  eliminarMiCorreo(
    @UsuarioActual() usuarioAutenticado: Usuario,
    @Param('correo_id', ParseIntPipe) correo_id: number,
  ) {
    return this.usuariosServicio.eliminarCorreoAlternativo(
      usuarioAutenticado.id,
      correo_id,
    );
  }

  @Patch('mi-perfil/correo-alternativo')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Actualizar correo alternativo del usuario autenticado',
    description: 'Actualiza o limpia el correo alternativo del usuario autenticado y lo sincroniza en correos_usuarios.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        correo_alternativo: { type: 'string', nullable: true, example: 'mi.alternativo@gmail.com' },
      },
    },
  })
  actualizarMiCorreoAlternativo(
    @UsuarioActual() usuarioAutenticado: Usuario,
    @Body('correo_alternativo') correo_alternativo: string | null,
  ) {
    return this.usuariosServicio.actualizarCorreoAlternativo(
      usuarioAutenticado.id,
      correo_alternativo ?? null,
    );
  }

  @Patch(':id/correo-alternativo')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Actualizar correo alternativo de un usuario (Administrador)',
    description: 'Permite a un administrador asignar o modificar el correo alternativo de cualquier usuario institucional.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del usuario' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        correo_alternativo: { type: 'string', nullable: true, example: 'supervisor.personal@gmail.com' },
      },
    },
  })
  actualizarCorreoAlternativoPorAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body('correo_alternativo') correo_alternativo: string | null,
  ) {
    return this.usuariosServicio.actualizarCorreoAlternativo(
      id,
      correo_alternativo ?? null,
    );
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
