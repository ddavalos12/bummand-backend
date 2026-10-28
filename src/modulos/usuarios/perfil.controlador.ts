import { Controller, Get, Put, Body, UseGuards, HttpStatus, Optional } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CODIGOS_ERROR } from '../../nucleo/errores/codigos-error.constante';
import { ExcepcionBumand } from '../../nucleo/errores/excepcion-bumand';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Usuario, Rol } from './entidades/usuario.entidad';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Becario } from '../becarios/entidades/becario.entidad';
import { UsuariosServicio } from './usuarios.servicio';

@ApiTags('Perfil')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtGuardia)
@Controller()
export class PerfilControlador {
  constructor(
    @InjectRepository(Becario)
    private readonly becarioRepositorio: Repository<Becario>,
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @Optional()
    private readonly usuariosServicio?: UsuariosServicio,
  ) {}

  @Get(['perfil', 'api/perfil'])
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async obtenerPerfil(@UsuarioActual() usuarioAutenticado: Usuario) {
    const usuario_db = await this.usuarioRepositorio.findOne({
      where: { id: usuarioAutenticado.id },
      relations: { correos_adicionales: true },
    });
    const correo_alternativo =
      usuario_db?.correo_alternativo ?? usuarioAutenticado.correo_alternativo ?? null;
    const correos_adicionales =
      usuario_db?.correos_adicionales ?? usuarioAutenticado.correos_adicionales ?? [];

    if (usuarioAutenticado.rol === Rol.BECARIO) {
      const becario = await this.becarioRepositorio.findOne({
        where: { usuario: { id: usuarioAutenticado.id } },
        relations: { usuario: true, supervisor: true, lugar_practica: true, iglesia: true },
      });
      if (becario) {
        return {
          id: becario.id,
          becario_id: becario.id,
          usuario_id: usuarioAutenticado.id,
          ci: becario.ci,
          nombre: usuario_db?.nombre || usuarioAutenticado.nombre,
          correo: usuario_db?.correo || usuarioAutenticado.correo,
          correo_alternativo,
          correos_adicionales,
          rol: usuarioAutenticado.rol,
          carrera: becario.carrera,
          universidad: becario.universidad,
          institucion: becario.institucion,
          unidad: becario.unidad,
          lugarPractica: becario.lugar_practica,
          lugar_practica: becario.lugar_practica,
          iglesia: becario.iglesia,
          supervisor: becario.supervisor,
        };
      }
    }

    return {
      id: usuarioAutenticado.id,
      usuario_id: usuarioAutenticado.id,
      nombre: usuario_db?.nombre || usuarioAutenticado.nombre,
      correo: usuario_db?.correo || usuarioAutenticado.correo,
      correo_alternativo,
      correos_adicionales,
      rol: usuarioAutenticado.rol,
      lugarPractica: null,
      lugar_practica: null,
    };
  }

  @Put(['perfil', 'api/perfil'])
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  async actualizarPerfil(
    @UsuarioActual() usuarioAutenticado: Usuario,
    @Body() datos: Record<string, unknown>,
  ) {
    if (usuarioAutenticado.rol === Rol.BECARIO) {
      const campos_protegidos = ['universidad', 'carrera', 'iglesia_id', 'lugar_practica_id', 'supervisor_id'];
      const contiene_protegido = campos_protegidos.some(
        (campo) => datos[campo] !== undefined && datos[campo] !== null,
      );

      if (contiene_protegido) {
        throw new ExcepcionBumand(
          CODIGOS_ERROR.ERR_AUTORIZACION_0001,
          'No está autorizado para modificar campos protegidos de becario: universidad, carrera, iglesia, lugar de práctica o supervisor',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    if (typeof datos.nombre === 'string' && datos.nombre.trim() !== '') {
      usuarioAutenticado.nombre = datos.nombre.trim();
      await this.usuarioRepositorio.save(usuarioAutenticado);
    }

    if (datos.correo_alternativo !== undefined) {
      const nuevo_correo_alt =
        typeof datos.correo_alternativo === 'string' && datos.correo_alternativo.trim() !== ''
          ? datos.correo_alternativo.trim().toLowerCase()
          : null;

      if (this.usuariosServicio) {
        await this.usuariosServicio.actualizarCorreoAlternativo(
          usuarioAutenticado.id,
          nuevo_correo_alt,
        );
      } else {
        usuarioAutenticado.correo_alternativo = nuevo_correo_alt;
        await this.usuarioRepositorio.save(usuarioAutenticado);
      }
    }

    return this.obtenerPerfil(usuarioAutenticado);
  }
}
