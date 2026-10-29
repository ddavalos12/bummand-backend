import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
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
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { JustificacionesServicio } from './justificaciones.servicio';
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

const almacenamientoComprobantes = diskStorage({
  destination: (req, file, cb) => {
    const carpeta = './uploads/justificaciones';
    if (!fs.existsSync(carpeta)) {
      fs.mkdirSync(carpeta, { recursive: true });
    }
    cb(null, carpeta);
  },
  filename: (req, file, cb) => {
    const sufijoUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `comprobante-${sufijoUnico}${extension}`);
  },
});

@ApiTags('Justificaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia, RolesGuardia)
@Controller('justificaciones')
export class JustificacionesControlador {
  constructor(private readonly justificaciones_servicio: JustificacionesServicio) {}

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Post('subir-comprobante')
  @UseInterceptors(FileInterceptor('archivo', { storage: almacenamientoComprobantes }))
  @ApiOperation({
    summary: 'Subir archivo o comprobante probatorio de justificación',
    description: 'Permite adjuntar certificados médicos, bajas o documentos respaldatorios en ./uploads/justificaciones.',
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
  subirComprobante(@UploadedFile() archivo?: any) {
    if (!archivo) {
      throw new BadRequestException('No se ha proporcionado ningún archivo en el campo "archivo"');
    }
    const archivo_prueba_url = `/uploads/justificaciones/${archivo.filename}`;
    return {
      archivo_prueba_url,
      nombre_archivo_prueba: archivo.originalname,
      tamano: archivo.size,
    };
  }

  @Roles(Rol.BECARIO)
  @Post()
  @ApiOperation({
    summary: 'Enviar solicitud formal de justificación',
    description: 'Permite a los becarios enviar justificaciones por inasistencias o demoras en prácticas, eventos o Escuela de Líderes.',
  })
  @ApiResponse({ status: 201, description: 'Justificación radicada en estado pendiente.', type: Justificacion })
  @ApiResponse({ status: 400, description: 'Datos incompletos o inválidos.' })
  crear(
    @Body() crearJustificacionDto: CrearJustificacionDto,
    @UsuarioActual() usuario: Usuario,
  ): Promise<Justificacion> {
    return this.justificaciones_servicio.crear(crearJustificacionDto, usuario.id);
  }

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get()
  @ApiOperation({
    summary: 'Listar todas las justificaciones',
    description: 'Permite a supervisores y administradores consultar la bandeja integral de justificaciones radicadas.',
  })
  @ApiResponse({ status: 200, description: 'Listado completo de justificaciones.', type: [Justificacion] })
  obtenerTodas(): Promise<Justificacion[]> {
    return this.justificaciones_servicio.obtenerTodas();
  }

  @Roles(Rol.BECARIO, Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Get('mis-justificaciones')
  @ApiOperation({
    summary: 'Listar justificaciones del becario autenticado',
    description: 'Retorna el historial particular de justificaciones y el dictamen administrativo de cada una.',
  })
  @ApiResponse({ status: 200, description: 'Historial de justificaciones del usuario.', type: [Justificacion] })
  obtenerMisJustificaciones(@UsuarioActual() usuario: Usuario): Promise<Justificacion[]> {
    return this.justificaciones_servicio.obtenerPorBecario(usuario.id);
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

  @Roles(Rol.SUPERVISOR, Rol.ADMINISTRADOR)
  @Patch(':id/resolver')
  @ApiOperation({
    summary: 'Resolver justificación (Aprobación o Rechazo motivado)',
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
}
