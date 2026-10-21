import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BecariosServicio } from './becarios.servicio';
import { CrearBecarioDto } from './dtos/crear-becario.dto';
import { ActualizarBecarioDto } from './dtos/actualizar-becario.dto';
import { AsignarSupervisorDto } from './dtos/asignar-supervisor.dto';
import { OrdenConfirmacionDatosDto } from './dtos/orden-confirmacion-datos.dto';
import { EstadoOrdenConfirmacionDto } from './dtos/estado-orden-confirmacion.dto';
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

  @Get('estado-orden-global')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Consultar estado institucional de orden de confirmación y enfriamiento',
    description: 'Devuelve si el botón de solicitud está disponible o bloqueado por el enfriamiento de 7 días.',
  })
  @ApiResponse({ status: 200, type: EstadoOrdenConfirmacionDto })
  obtenerEstadoOrdenGlobal(): Promise<EstadoOrdenConfirmacionDto> {
    return this.becariosServicio.calcularEstadoOrdenGlobal();
  }

  @Post('orden-confirmacion-datos')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Emitir orden de confirmación mensual de datos con enfriamiento de 7 días',
    description: 'Activa o desactiva la bandera global institucional que obliga a los becarios a confirmar sus datos académicos.',
  })
  @ApiResponse({ status: 200, description: 'Estado de confirmación de datos actualizado.' })
  ordenConfirmacionDatos(
    @UsuarioActual() usuarioAutenticado: Usuario,
    @Body() dto?: OrdenConfirmacionDatosDto,
  ) {
    const activa = dto ? dto.confirmacion_datos_requerida !== false : true;
    return this.becariosServicio.ordenConfirmacionDatos(activa, usuarioAutenticado?.id);
  }

  @Get('estado-confirmacion-datos')
  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Consultar estado de confirmación de datos',
    description: 'Devuelve si el usuario autenticado tiene pendiente la confirmación de datos institucional.',
  })
  @ApiResponse({ status: 200, description: 'Estado de confirmación obtenido.' })
  estadoConfirmacionDatos(@UsuarioActual() usuario: Usuario) {
    return this.becariosServicio.obtenerEstadoConfirmacionDatos(usuario.id);
  }

  @Post('confirmar-datos')
  @Roles(Rol.BECARIO)
  @ApiOperation({
    summary: 'Confirmar datos institucionales del propio becario',
    description: 'Permite al becario autenticado confirmar formalmente que sus datos de expediente se encuentran actualizados.',
  })
  @ApiResponse({ status: 200, description: 'Confirmación registrada con éxito.' })
  confirmarDatosPropios(@UsuarioActual() usuario: Usuario) {
    return this.becariosServicio.confirmarDatosPropios(usuario.id);
  }

  @Put(':id/asignar-supervisor')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Asignar supervisor institucional a un becario',
    description: 'Permite al administrador vincular un becario a un supervisor o tutor específico.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Supervisor asignado exitosamente.', type: Becario })
  asignarSupervisor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarSupervisorDto,
  ): Promise<Becario> {
    return this.becariosServicio.asignarSupervisor(id, dto.supervisor_id);
  }

  @Put(':id/validar-datos')
  @Roles(Rol.ADMINISTRADOR)
  @ApiOperation({
    summary: 'Validar oficialmente datos del becario por administrador',
    description: 'Marca el expediente del becario como validado y verificado por la administración.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Datos del becario validados.', type: Becario })
  validarDatos(@Param('id', ParseIntPipe) id: number): Promise<Becario> {
    return this.becariosServicio.validarDatos(id);
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
    @UsuarioActual() usuarioAutenticado: Usuario,
  ): Promise<Becario> {
    return this.becariosServicio.obtener(id, usuarioAutenticado);
  }

  @Get(':id/horarios')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Obtener grilla horaria asignada a un becario',
  })
  obtenerHorarios(@Param('id', ParseIntPipe) id: number) {
    return this.becariosServicio.obtenerHorarios(id);
  }

  @Put(':id/horarios')
  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR)
  @ApiOperation({
    summary: 'Guardar o actualizar la grilla horaria de práctica institucional de un becario',
  })
  guardarHorarios(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      lugar_practica_id?: number;
      dias: Array<{
        dia_semana: number;
        hora_inicio: string;
        hora_fin: string;
        horas_diarias?: number;
        turno?: string;
        activo?: boolean;
      }>;
    },
  ) {
    return this.becariosServicio.guardarHorarios(id, dto);
  }

  @Put(':id')
  @Roles(Rol.ADMINISTRADOR, Rol.BECARIO)
  @ApiOperation({
    summary: 'Actualizar expediente de becario',
    description: 'Modifica datos de un becario. Si el rol es becario, se bloquea la modificación de campos protegidos con ERR-AUTORIZACION-0001.',
  })
  @ApiParam({ name: 'id', description: 'Identificador del becario', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Becario actualizado.', type: Becario })
  @ApiResponse({ status: 403, description: 'Intento de modificar campos protegidos por rol becario.' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarBecarioDto,
    @UsuarioActual() usuarioAutenticado: Usuario,
  ): Promise<Becario> {
    return this.becariosServicio.actualizar(id, dto, usuarioAutenticado.rol, usuarioAutenticado.id);
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
