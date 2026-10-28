import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario, Rol, EstadoUsuario } from './entidades/usuario.entidad';
import { CorreoUsuario } from './entidades/correo-usuario.entidad';
import { CrearUsuarioDto } from './dtos/crear-usuario.dto';
import { hashearContrasena } from '../../utilidades/hash.utilidad';

@Injectable()
export class UsuariosServicio {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepositorio: Repository<Usuario>,
    @Optional()
    @InjectRepository(CorreoUsuario)
    private readonly correoUsuarioRepositorio?: Repository<CorreoUsuario>,
  ) {}

  async verificarCorreoDisponible(
    correo: string,
    excluir_usuario_id?: number,
  ): Promise<string> {
    const correo_limpio = (correo || '').trim().toLowerCase();
    if (!correo_limpio || !correo_limpio.includes('@')) {
      throw new BadRequestException('Debe proporcionar un correo electrónico válido.');
    }

    const existente_principal = await this.usuarioRepositorio.findOne({
      where: [
        { correo: correo_limpio },
        { correo_alternativo: correo_limpio },
      ],
    });

    if (
      existente_principal &&
      (excluir_usuario_id === undefined ||
        existente_principal.id !== excluir_usuario_id)
    ) {
      throw new ConflictException(
        'Ya existe un usuario con este correo registrado en el sistema.',
      );
    }

    if (this.correoUsuarioRepositorio) {
      const existente_adicional = await this.correoUsuarioRepositorio.findOne({
        where: { correo: correo_limpio },
      });
      if (
        existente_adicional &&
        (excluir_usuario_id === undefined ||
          existente_adicional.usuario_id !== excluir_usuario_id)
      ) {
        throw new ConflictException(
          'Este correo electrónico ya está vinculado a otra cuenta de usuario.',
        );
      }
    }

    return correo_limpio;
  }

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    if (dto.rol === Rol.BECARIO) {
      throw new ConflictException('Los becarios deben crearse desde el módulo de becarios.');
    }

    const correo_limpio = await this.verificarCorreoDisponible(dto.correo);

    const nuevo_usuario = this.usuarioRepositorio.create({
      ...dto,
      correo: correo_limpio,
      contrasena_hash: await hashearContrasena(dto.contrasena),
    });

    return this.usuarioRepositorio.save(nuevo_usuario);
  }

  async listar(rol_filtro?: Rol): Promise<Usuario[]> {
    const condicion_where = rol_filtro ? { rol: rol_filtro } : {};
    return this.usuarioRepositorio.find({
      where: condicion_where,
      select: {
        id: true,
        nombre: true,
        correo: true,
        correo_alternativo: true,
        rol: true,
        estado: true,
        created_at: true,
      },
      relations: {
        correos_adicionales: true,
      },
      order: { id: 'ASC' },
    });
  }

  async cambiarEstado(id: number, estado: EstadoUsuario): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    usuario.estado = estado;
    return this.usuarioRepositorio.save(usuario);
  }

  async obtenerTodos(): Promise<Usuario[]> {
    return this.usuarioRepositorio.find();
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    return this.usuarioRepositorio.findOne({ where: { id } });
  }

  async obtenerPorIdConRelaciones(id: number): Promise<Usuario | null> {
    return this.usuarioRepositorio.findOne({
      where: { id },
      relations: { becario: true, correos_adicionales: true },
    });
  }

  async obtenerPorCorreo(correo: string): Promise<Usuario | null> {
    return this.obtenerPorCorreoConRelaciones(correo);
  }

  async obtenerPorCorreoConRelaciones(correo: string): Promise<Usuario | null> {
    const correo_limpio = (correo || '').trim().toLowerCase();
    if (!correo_limpio) return null;

    let usuario = await this.usuarioRepositorio.findOne({
      where: [
        { correo: correo_limpio },
        { correo_alternativo: correo_limpio },
      ],
      relations: { becario: true, correos_adicionales: true },
    });

    if (!usuario) {
      usuario = await this.usuarioRepositorio.findOne({
        where: { correo },
        relations: { becario: true },
      });
    }

    if (!usuario && this.correoUsuarioRepositorio) {
      const registro_correo = await this.correoUsuarioRepositorio.findOne({
        where: { correo: correo_limpio },
      });
      if (registro_correo) {
        usuario = await this.obtenerPorIdConRelaciones(registro_correo.usuario_id);
      }
    }

    return usuario;
  }

  async listarCorreosUsuario(usuario_id: number) {
    const usuario = await this.obtenerPorIdConRelaciones(usuario_id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const adicionales = this.correoUsuarioRepositorio
      ? await this.correoUsuarioRepositorio.find({
          where: { usuario_id },
          order: { id: 'ASC' },
        })
      : usuario.correos_adicionales || [];

    return {
      usuario_id: usuario.id,
      correo_principal: usuario.correo,
      correo_alternativo: usuario.correo_alternativo || null,
      correos_adicionales: adicionales,
    };
  }

  async agregarCorreoAlternativo(
    usuario_id: number,
    correo: string,
    etiqueta?: string,
  ) {
    const usuario = await this.obtenerPorIdConRelaciones(usuario_id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const correo_limpio = await this.verificarCorreoDisponible(correo, usuario_id);

    if (usuario.correo.trim().toLowerCase() === correo_limpio) {
      throw new ConflictException(
        'Este correo ya está registrado como tu correo principal.',
      );
    }

    if (this.correoUsuarioRepositorio) {
      const ya_vinculado = await this.correoUsuarioRepositorio.findOne({
        where: { usuario_id, correo: correo_limpio },
      });
      if (ya_vinculado) {
        throw new ConflictException(
          'Este correo alternativo ya se encuentra vinculado a tu cuenta.',
        );
      }

      const nuevo_correo = this.correoUsuarioRepositorio.create({
        usuario_id,
        correo: correo_limpio,
        etiqueta: etiqueta?.trim() || 'Alternativo',
      });
      await this.correoUsuarioRepositorio.save(nuevo_correo);
    }

    if (!usuario.correo_alternativo) {
      usuario.correo_alternativo = correo_limpio;
      await this.usuarioRepositorio.save(usuario);
    }

    return this.listarCorreosUsuario(usuario_id);
  }

  async eliminarCorreoAlternativo(usuario_id: number, correo_id: number) {
    const usuario = await this.obtenerPorIdConRelaciones(usuario_id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!this.correoUsuarioRepositorio) {
      throw new BadRequestException('Repositorio de correos adicionales no disponible');
    }

    const registro = await this.correoUsuarioRepositorio.findOne({
      where: { id: correo_id, usuario_id },
    });

    if (!registro) {
      throw new NotFoundException('Correo alternativo no encontrado en tu cuenta');
    }

    const correo_eliminado = registro.correo;
    await this.correoUsuarioRepositorio.remove(registro);

    if (usuario.correo_alternativo === correo_eliminado) {
      const restantes = await this.correoUsuarioRepositorio.find({
        where: { usuario_id },
        order: { id: 'ASC' },
      });
      usuario.correo_alternativo = restantes.length > 0 ? restantes[0].correo : null;
      await this.usuarioRepositorio.save(usuario);
    }

    return this.listarCorreosUsuario(usuario_id);
  }

  async actualizarCorreoAlternativo(
    usuario_id: number,
    correo_alternativo: string | null,
  ) {
    const usuario = await this.obtenerPorIdConRelaciones(usuario_id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!correo_alternativo || correo_alternativo.trim() === '') {
      const anterior = usuario.correo_alternativo;
      usuario.correo_alternativo = null;
      await this.usuarioRepositorio.save(usuario);

      if (anterior && this.correoUsuarioRepositorio) {
        const reg_anterior = await this.correoUsuarioRepositorio.findOne({
          where: { usuario_id, correo: anterior },
        });
        if (reg_anterior) {
          await this.correoUsuarioRepositorio.remove(reg_anterior);
        }
      }
      return this.listarCorreosUsuario(usuario_id);
    }

    const correo_limpio = await this.verificarCorreoDisponible(
      correo_alternativo,
      usuario_id,
    );

    if (usuario.correo.trim().toLowerCase() === correo_limpio) {
      throw new ConflictException(
        'El correo alternativo no puede ser idéntico al correo principal.',
      );
    }

    usuario.correo_alternativo = correo_limpio;
    await this.usuarioRepositorio.save(usuario);

    if (this.correoUsuarioRepositorio) {
      const existente = await this.correoUsuarioRepositorio.findOne({
        where: { usuario_id, correo: correo_limpio },
      });
      if (!existente) {
        const nuevo = this.correoUsuarioRepositorio.create({
          usuario_id,
          correo: correo_limpio,
          etiqueta: 'Alternativo',
        });
        await this.correoUsuarioRepositorio.save(nuevo);
      }
    }

    return this.listarCorreosUsuario(usuario_id);
  }

  async confirmarCorreo(token: string, correo?: string): Promise<Usuario> {
    const condicion: Record<string, unknown> = { token_confirmacion: token };
    if (correo) {
      condicion.correo = correo;
    }
    const usuario = await this.usuarioRepositorio.findOne({ where: condicion });
    if (!usuario) {
      throw new BadRequestException('Token de confirmación de correo inválido o no encontrado');
    }
    usuario.correo_confirmado = true;
    usuario.token_confirmacion = null;
    return this.usuarioRepositorio.save(usuario);
  }
}
