import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JustificacionesServicio } from './justificaciones.servicio';
import { AlmacenamientoServicio } from '../almacenamiento/almacenamiento.servicio';
import { Justificacion } from './entidades/justificacion.entidad';
import { CrearJustificacionDto } from './dtos/crear-justificacion.dto';
import { ResolverJustificacionDto } from './dtos/resolver-justificacion.dto';
import {
  RevisarSupervisorJustificacionDto,
  AprobarAdminJustificacionDto,
} from './dtos/revisar-justificacion.dto';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { RolesGuardia } from '../autenticacion/roles.guardia';
import { Roles } from '../autenticacion/roles.decorador';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

const LIMITE_TAMANO_COMPROBANTE_BYTES = 15 * 1024 * 1024;

const opciones_subida_comprobantes = {
  storage: memoryStorage(),
  limits: { fileSize: LIMITE_TAMANO_COMPROBANTE_BYTES },
};

@ApiTags('Justificaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller(['justificaciones', 'api/justificaciones'])
export class JustificacionesControlador {
  constructor(
    private readonly justificaciones_servicio: JustificacionesServicio,
    @Optional()
    private readonly almacenamiento_servicio: AlmacenamientoServicio = new AlmacenamientoServicio(),
  ) {}

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('subir-comprobante')
  @UseInterceptors(FileInterceptor('archivo', opciones_subida_comprobantes))
  @ApiOperation({
    summary: 'Subir archivo o comprobante probatorio de justificación',
    description: 'Permite adjuntar certificados médicos, bajas o documentos respaldatorios en almacenamiento institucional (R2 o local).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: {
          type: 'string',
          format: 'binary',
          description: 'Documento PDF, JPG o PNG de comprobante',
        },
      },
      required: ['archivo'],
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo cargado con éxito en el servidor.' })
  @ApiResponse({ status: 400, description: 'No se adjuntó archivo válido.' })
  async subirComprobante(@UploadedFile() archivo?: any) {
    if (!archivo) {
      throw new BadRequestException('No se ha proporcionado ningún archivo en el campo "archivo"');
    }
    const resultado = await this.almacenamiento_servicio.guardarArchivo(
      archivo,
      'justificaciones',
      'comprobante',
    );
    return {
      archivo_prueba_url: resultado.url,
      nombre_archivo_prueba: archivo.originalname,
      tamano: archivo.size,
    };
  }

  @Roles(Rol.BECARIO, Rol.ADMINISTRADOR)
  @Post()
  @ApiOperation({
    summary: 'Enviar solicitud formal de justificación',
    description: 'Permite a los becarios y administradores radicar justificaciones por inasistencias o demoras en prácticas, eventos o Escuela de Líderes.',
  })
  @ApiResponse({ status: 201, description: 'Justificación radicada en estado pendiente o aprobada directamente.', type: Justificacion })
  @ApiResponse({ status: 400, description: 'Datos incompletos o inválidos.' })
  crear(
    @Body() crearJustificacionDto: CrearJustificacionDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Justificacion> {
    return this.justificaciones_servicio.crear(crearJustificacionDto, usuario.id, usuario.rol);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('pendientes-supervisor')
  @ApiOperation({
    summary: 'Listar justificaciones pendientes de revisión para el mentor',
    description: 'Retorna las justificaciones de los becarios designados al mentor autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Listado de justificaciones del mentor.', type: [Justificacion] })
  listarPendientesSupervisor(
    @UsuarioActual() usuario: Usuario,
    @Query('supervisor_id') supervisor_id?: number,
  ): Promise<Justificacion[]> {
    return this.justificaciones_servicio.listarPendientesSupervisor(
      usuario,
      supervisor_id ? Number(supervisor_id) : undefined,
    );
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get()
  @ApiOperation({
    summary: 'Listar todas las justificaciones',
    description: 'Permite a mentores y administradores consultar la bandeja de justificaciones radicadas (filtrada por mentor si aplica).',
  })
  @ApiResponse({ status: 200, description: 'Listado completo de justificaciones.', type: [Justificacion] })
  obtenerTodas(
    @UsuarioActual() usuario?: Usuario,
    @Query('supervisor_id') supervisor_id?: number,
  ): Promise<Justificacion[]> {
    return this.justificaciones_servicio.obtenerTodas(
      usuario,
      supervisor_id ? Number(supervisor_id) : undefined,
    );
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('mis-justificaciones')
  @ApiOperation({
    summary: 'Listar justificaciones del becario autenticado',
    description: 'Retorna el historial particular de justificaciones y el dictamen administrativo de cada una.',
  })
  @ApiResponse({ status: 200, description: 'Historial de justificaciones del usuario.', type: [Justificacion] })
  obtenerMisJustificaciones(@UsuarioActual() usuario: Usuario): Promise<Justificacion[]> {
    return this.justificaciones_servicio.obtenerPorBecario(usuario.id, usuario);
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener justificación por ID',
    description: 'Consulta el detalle, motivo y fundamentación de resolución de una justificación específica.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la justificación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Detalle de la justificación.', type: Justificacion })
  @ApiResponse({ status: 404, description: 'Justificación no encontrada.' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<Justificacion> {
    return this.justificaciones_servicio.obtenerPorId(id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/revisar-supervisor')
  @ApiOperation({
    summary: 'Revisión técnica de justificación por Supervisor (Flujo de 2 Pasos)',
    description: 'Transiciona el permiso a estado revisado_supervisor (u observada/rechazada) con registro de trazabilidad.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la justificación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Justificación revisada por el supervisor.', type: Justificacion })
  revisarSupervisor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevisarSupervisorJustificacionDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Justificacion> {
    return this.justificaciones_servicio.revisarSupervisor(id, dto, usuario.id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Patch(':id/aprobar-administracion')
  @ApiOperation({
    summary: 'Aprobación definitiva de permiso por Administración Central (Flujo de 2 Pasos)',
    description: 'Aprueba formalmente el permiso y exime/anula automáticamente las multas de viernes de la fecha correspondiente.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la justificación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Justificación aprobada formalmente y multas condonadas.', type: Justificacion })
  aprobarAdministracion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AprobarAdminJustificacionDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Justificacion> {
    return this.justificaciones_servicio.aprobarAdministracion(id, dto, usuario.id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Patch(':id/resolver')
  @ApiOperation({
    summary: 'Resolver justificación (Aprobación o Rechazo motivado por Administración)',
    description: 'Dictamina de forma motivada la aprobación o el rechazo institucional de la justificación.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la justificación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Justificación resuelta con éxito.', type: Justificacion })
  @ApiResponse({ status: 400, description: 'Resolución inválida o falta observación motivada.' })
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolverJustificacionDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Justificacion> {
    return this.justificaciones_servicio.resolver(id, dto, usuario.id);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.SUPERVISOR, Rol.BECARIO)
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar solicitud de permiso o justificación',
    description:
      'Permite a Administración o Supervisores autorizados eliminar registros erróneos o de prueba (y a becarios eliminar sus solicitudes pendientes), sincronizado con la APK.',
  })
  @ApiParam({ name: 'id', description: 'Identificador de la justificación', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Justificación eliminada exitosamente.' })
  eliminar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: Usuario,
  ): Promise<{ mensaje: string }> {
    return this.justificaciones_servicio.eliminar(id, usuario);
  }
}
