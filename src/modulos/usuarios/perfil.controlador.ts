import { Controller, Get, Put, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CODIGOS_ERROR } from '../../nucleo/errores/codigos-error.constante';
import { ExcepcionBumand } from '../../nucleo/errores/excepcion-bumand';
import { JwtGuardia } from '../autenticacion/jwt.guardia';
import { UsuarioActual } from '../autenticacion/usuario-actual.decorador';
import { Usuario, Rol } from './entidades/usuario.entidad';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Becario } from '../becarios/entidades/becario.entidad';

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
  ) {}

  @Get(['perfil', 'api/perfil'])
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async obtenerPerfil(@UsuarioActual() usuarioAutenticado: Usuario) {
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
          nombre: usuarioAutenticado.nombre,
          correo: usuarioAutenticado.correo,
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
      nombre: usuarioAutenticado.nombre,
      correo: usuarioAutenticado.correo,
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

      const becario = await this.becarioRepositorio.findOne({
        where: { usuario: { id: usuarioAutenticado.id } },
        relations: { usuario: true },
      });
      if (becario) {
        if (typeof datos.nombre === 'string') {
          usuarioAutenticado.nombre = datos.nombre;
          await this.usuarioRepositorio.save(usuarioAutenticado);
        }
        return this.obtenerPerfil(usuarioAutenticado);
      }
    }

    if (typeof datos.nombre === 'string') {
      usuarioAutenticado.nombre = datos.nombre;
      await this.usuarioRepositorio.save(usuarioAutenticado);
    }
    return this.obtenerPerfil(usuarioAutenticado);
  }
}
