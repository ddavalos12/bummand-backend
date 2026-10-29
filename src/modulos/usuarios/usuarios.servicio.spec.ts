import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsuariosServicio } from './usuarios.servicio';
import { Usuario, Rol, EstadoUsuario } from './entidades/usuario.entidad';
import { CorreoUsuario } from './entidades/correo-usuario.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import * as hashUtilidad from '../../utilidades/hash.utilidad';

describe('UsuariosServicio', () => {
  let servicio: UsuariosServicio;
  let usuario_repo: any;
  let correo_usuario_repo: any;
  let becario_repo: any;

  beforeEach(async () => {
    usuario_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
    };

    correo_usuario_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
      remove: jest.fn().mockResolvedValue({}),
    };

    becario_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosServicio,
        { provide: getRepositoryToken(Usuario), useValue: usuario_repo },
        { provide: getRepositoryToken(CorreoUsuario), useValue: correo_usuario_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
      ],
    }).compile();

    servicio = modulo.get<UsuariosServicio>(UsuariosServicio);
  });

  describe('Creación y Listado de Usuarios', () => {
    it('debe rechazar la creación de usuarios con rol BECARIO desde este módulo', async () => {
      await expect(
        servicio.crear({
          nombre: 'Juan Perez',
          correo: 'juan@diaconia.bo',
          contrasena: 'ClaveSegura123*',
          rol: Rol.BECARIO,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear un usuario supervisor exitosamente', async () => {
      usuario_repo.findOne.mockResolvedValue(null);
      correo_usuario_repo.findOne.mockResolvedValue(null);

      const resultado = await servicio.crear({
        nombre: 'Supervisor Uno',
        correo: 'supervisor@diaconia.bo',
        contrasena: 'Clave123*',
        rol: Rol.SUPERVISOR,
      });

      expect(resultado.nombre).toBe('Supervisor Uno');
      expect(resultado.correo).toBe('supervisor@diaconia.bo');
      expect(usuario_repo.save).toHaveBeenCalled();
    });

    it('debe listar usuarios con relaciones de becario y correos adicionales', async () => {
      usuario_repo.find.mockResolvedValue([
        { id: 1, nombre: 'Admin', rol: Rol.ADMINISTRADOR, correos_adicionales: [], becario: null },
      ]);

      const lista = await servicio.listar();
      expect(lista.length).toBe(1);
      expect(usuario_repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: {
            correos_adicionales: true,
            becario: true,
          },
        }),
      );
    });

    it('debe cambiar el estado de un usuario', async () => {
      const usuario_mock: Partial<Usuario> = {
        id: 5,
        estado: EstadoUsuario.ACTIVO,
      };
      usuario_repo.findOne.mockResolvedValue(usuario_mock);

      const resultado = await servicio.cambiarEstado(5, EstadoUsuario.INACTIVO);
      expect(resultado.estado).toBe(EstadoUsuario.INACTIVO);
      expect(usuario_repo.save).toHaveBeenCalled();
    });
  });

  describe('obtenerMiPerfilCompleto', () => {
    it('debe retornar perfil completo con datos de ficha becario si está vinculado', async () => {
      const fecha_creacion = new Date('2026-01-15');
      const becario_mock: Partial<Becario> = {
        id: 10,
        ci: '9107373',
        celular: '77712345',
        direccion: 'Calle Falsa 123',
        universidad: 'UMSA',
        carrera: 'Ingeniería de Sistemas',
        modalidad_pasajes: 'ida_y_vuelta',
        supervisor_id: 2,
      };

      const usuario_mock: Partial<Usuario> = {
        id: 15,
        nombre: 'Adai Belen',
        correo: 'adai@diaconia.bo',
        correo_alternativo: 'adai.personal@gmail.com',
        rol: Rol.BECARIO,
        estado: EstadoUsuario.ACTIVO,
        correo_confirmado: true,
        created_at: fecha_creacion,
        correos_adicionales: [],
        becario: becario_mock as Becario,
      };

      usuario_repo.findOne.mockResolvedValue(usuario_mock);

      const perfil = await servicio.obtenerMiPerfilCompleto(15);

      expect(perfil.id).toBe(15);
      expect(perfil.nombre).toBe('Adai Belen');
      expect(perfil.correo).toBe('adai@diaconia.bo');
      expect(perfil.becario).toBeDefined();
      expect(perfil.becario?.ci).toBe('9107373');
      expect(perfil.becario?.telefono).toBe('77712345');
      expect(perfil.becario?.universidad).toBe('UMSA');
      expect(perfil.carrera).toBe('Ingeniería de Sistemas');
    });

    it('debe retornar perfil con becario null si el usuario es supervisor o administrador', async () => {
      const usuario_mock: Partial<Usuario> = {
        id: 2,
        nombre: 'Supervisor Test',
        correo: 'supervisor@diaconia.bo',
        correo_alternativo: null,
        rol: Rol.SUPERVISOR,
        estado: EstadoUsuario.ACTIVO,
        correo_confirmado: true,
        created_at: new Date(),
        correos_adicionales: [],
        becario: null as any,
      };

      usuario_repo.findOne.mockResolvedValue(usuario_mock);
      becario_repo.findOne.mockResolvedValue(null);

      const perfil = await servicio.obtenerMiPerfilCompleto(2);

      expect(perfil.id).toBe(2);
      expect(perfil.becario).toBeNull();
      expect(perfil.ci).toBeNull();
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usuario_repo.findOne.mockResolvedValue(null);

      await expect(servicio.obtenerMiPerfilCompleto(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizarMiPerfil', () => {
    it('debe actualizar datos personales y de ficha becario vinculada', async () => {
      const becario_mock: Partial<Becario> = {
        id: 7,
        usuario_id: 12,
        nombre: 'Antiguo Nombre',
        celular: '60000000',
        direccion: 'Direccion Antigua',
        carrera: 'Derecho',
      };

      const usuario_mock: Partial<Usuario> = {
        id: 12,
        nombre: 'Antiguo Nombre',
        correo: 'usuario@diaconia.bo',
        correo_alternativo: null,
        rol: Rol.BECARIO,
        estado: EstadoUsuario.ACTIVO,
        correo_confirmado: true,
        created_at: new Date(),
        correos_adicionales: [],
        becario: becario_mock as Becario,
      };

      usuario_repo.findOne.mockResolvedValue(usuario_mock);
      becario_repo.findOne.mockResolvedValue(becario_mock);

      const resultado = await servicio.actualizarMiPerfil(12, {
        nombre: 'Nuevo Nombre',
        telefono: '77788990',
        direccion: 'Calle Nueva 456',
        carrera: 'Ingeniería Comercial',
      });

      expect(usuario_mock.nombre).toBe('Nuevo Nombre');
      expect(becario_mock.celular).toBe('77788990');
      expect(becario_mock.direccion).toBe('Calle Nueva 456');
      expect(becario_mock.carrera).toBe('Ingeniería Comercial');
      expect(becario_repo.save).toHaveBeenCalled();
      expect(resultado.nombre).toBe('Nuevo Nombre');
    });

    it('debe actualizar correo institucional validando disponibilidad', async () => {
      const usuario_mock: Partial<Usuario> = {
        id: 8,
        nombre: 'Usuario Ocho',
        correo: 'ocho@diaconia.bo',
        correo_alternativo: null,
        rol: Rol.SUPERVISOR,
        estado: EstadoUsuario.ACTIVO,
        correo_confirmado: true,
        created_at: new Date(),
        correos_adicionales: [],
        becario: null as any,
      };

      usuario_repo.findOne
        .mockResolvedValueOnce(usuario_mock) // Primera búsqueda en actualizarMiPerfil
        .mockResolvedValueOnce(null) // Búsqueda de disponibilidad
        .mockResolvedValueOnce(usuario_mock); // Búsqueda en obtenerMiPerfilCompleto
      correo_usuario_repo.findOne.mockResolvedValue(null);

      await servicio.actualizarMiPerfil(8, {
        correo: 'nuevo.ocho@diaconia.bo',
      });

      expect(usuario_mock.correo).toBe('nuevo.ocho@diaconia.bo');
      expect(usuario_repo.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usuario_repo.findOne.mockResolvedValue(null);

      await expect(
        servicio.actualizarMiPerfil(99, { nombre: 'Inexistente' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cambiarMiContrasena', () => {
    it('debe actualizar la contraseña cuando la clave actual coincide', async () => {
      const hash_actual = await hashUtilidad.hashearContrasena('ClaveVieja123*');
      const usuario_mock: Partial<Usuario> = {
        id: 4,
        contrasena_hash: hash_actual,
      };

      usuario_repo.findOne.mockResolvedValue(usuario_mock);

      const res = await servicio.cambiarMiContrasena(4, {
        contrasena_actual: 'ClaveVieja123*',
        nueva_contrasena: 'NuevaClaveSegura2026*',
      });

      expect(res.actualizado).toBe(true);
      expect(res.mensaje).toContain('exitosa');
      expect(usuario_repo.save).toHaveBeenCalled();
    });

    it('debe rechazar el cambio si la contraseña actual es incorrecta', async () => {
      const hash_actual = await hashUtilidad.hashearContrasena('ClaveCorrecta123*');
      const usuario_mock: Partial<Usuario> = {
        id: 4,
        contrasena_hash: hash_actual,
      };

      usuario_repo.findOne.mockResolvedValue(usuario_mock);

      await expect(
        servicio.cambiarMiContrasena(4, {
          contrasena_actual: 'ClaveIncorrecta*',
          nueva_contrasena: 'NuevaClaveSegura2026*',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si la nueva contraseña tiene menos de 6 caracteres', async () => {
      const hash_actual = await hashUtilidad.hashearContrasena('Clave123*');
      const usuario_mock: Partial<Usuario> = {
        id: 4,
        contrasena_hash: hash_actual,
      };

      usuario_repo.findOne.mockResolvedValue(usuario_mock);

      await expect(
        servicio.cambiarMiContrasena(4, {
          contrasena_actual: 'Clave123*',
          nueva_contrasena: '123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el usuario a cambiar contraseña no existe', async () => {
      usuario_repo.findOne.mockResolvedValue(null);

      await expect(
        servicio.cambiarMiContrasena(999, {
          nueva_contrasena: 'ClaveSegura123*',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizarUsuarioPorAdmin', () => {
    it('debe modificar datos, rol, estado y contraseña administrativamente sin exponer contrasena_hash', async () => {
      const usuario_mock: Partial<Usuario> = {
        id: 3,
        nombre: 'Nombre Previo',
        correo: 'previo@diaconia.bo',
        rol: Rol.BECARIO,
        estado: EstadoUsuario.ACTIVO,
        contrasena_hash: 'hash_anterior',
      };

      usuario_repo.findOne
        .mockResolvedValueOnce(usuario_mock)
        .mockResolvedValueOnce(null); // Para verificarCorreoDisponible
      correo_usuario_repo.findOne.mockResolvedValue(null);

      const resultado = await servicio.actualizarUsuarioPorAdmin(3, {
        nombre: 'Nombre Editado',
        correo: 'editado@diaconia.bo',
        rol: Rol.SUPERVISOR,
        estado: EstadoUsuario.INACTIVO,
        nueva_contrasena: 'NuevaClaveAdmin2026*',
      });

      expect(resultado.id).toBe(3);
      expect(resultado.nombre).toBe('Nombre Editado');
      expect(resultado.correo).toBe('editado@diaconia.bo');
      expect(resultado.rol).toBe(Rol.SUPERVISOR);
      expect(resultado.estado).toBe(EstadoUsuario.INACTIVO);
      expect((resultado as any).contrasena_hash).toBeUndefined();
      expect(usuario_repo.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usuario_repo.findOne.mockResolvedValue(null);

      await expect(
        servicio.actualizarUsuarioPorAdmin(999, { nombre: 'No Existe' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restablecerContrasenaPorAdmin', () => {
    it('debe restablecer la contraseña forzosamente', async () => {
      const usuario_mock: Partial<Usuario> = {
        id: 6,
        contrasena_hash: 'hash_antiguo',
      };
      usuario_repo.findOne.mockResolvedValue(usuario_mock);

      const res = await servicio.restablecerContrasenaPorAdmin(6, 'NuevaClaveForzada2026*');

      expect(res.usuario_id).toBe(6);
      expect(res.mensaje).toContain('restablecida exitosamente');
      expect(usuario_repo.save).toHaveBeenCalled();
    });

    it('debe rechazar contraseña con menos de 6 caracteres', async () => {
      await expect(
        servicio.restablecerContrasenaPorAdmin(6, '12345'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el usuario a restablecer no existe', async () => {
      usuario_repo.findOne.mockResolvedValue(null);

      await expect(
        servicio.restablecerContrasenaPorAdmin(999, 'ClaveValida123*'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
