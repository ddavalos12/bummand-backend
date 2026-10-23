import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { AutenticacionServicio } from './autenticacion.servicio';
import { UsuariosServicio } from '../usuarios/usuarios.servicio';
import { Usuario, Rol, EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { hashearContrasena } from '../../utilidades/hash.utilidad';

jest.mock('@nestjs/jwt', () => {
  return {
    JwtService: jest.fn().mockImplementation(() => ({
      sign: jest.fn().mockReturnValue('jwt_token_simulado'),
    })),
  };
});

import { JwtService } from '@nestjs/jwt';

describe('AutenticacionServicio', () => {
  let servicio: AutenticacionServicio;
  let usuariosServicio: jest.Mocked<Partial<UsuariosServicio>>;
  let becarioRepo: any;
  let usuarioRepo: any;
  let jwtService: any;

  beforeEach(async () => {
    usuariosServicio = {
      obtenerPorCorreoConRelaciones: jest.fn(),
    };

    becarioRepo = {
      find: jest.fn(),
      save: jest.fn().mockImplementation((b) => Promise.resolve(b)),
    };

    usuarioRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((u) => ({ id: 99, ...u })),
      save: jest.fn().mockImplementation((u) => Promise.resolve({ id: 99, ...u })),
    };

    jwtService = new (JwtService as any)();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutenticacionServicio,
        { provide: UsuariosServicio, useValue: usuariosServicio },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(Becario), useValue: becarioRepo },
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepo },
      ],
    }).compile();

    servicio = module.get<AutenticacionServicio>(AutenticacionServicio);
  });

  it('debe iniciar sesión exitosamente con credenciales válidas y rol supervisor', async () => {
    const passwordHash = await hashearContrasena('Bumand2026!');
    usuariosServicio.obtenerPorCorreoConRelaciones!.mockResolvedValue({
      id: 2,
      nombre: 'Angel Javier Ali Paz',
      correo: 'angel.ali@bumand.bo',
      contrasena_hash: passwordHash,
      rol: Rol.SUPERVISOR,
      estado: EstadoUsuario.ACTIVO,
      becario: null,
    } as any);

    const resultado = await servicio.iniciarSesion({
      correo: 'angel.ali@bumand.bo',
      contrasena: 'Bumand2026!',
    });

    expect(resultado.mensaje).toBe('Inicio de sesión exitoso');
    expect(resultado.token).toBe('jwt_token_simulado');
    expect(resultado.usuario).toEqual({
      id: 2,
      nombre: 'Angel Javier Ali Paz',
      correo: 'angel.ali@bumand.bo',
      rol: Rol.SUPERVISOR,
      becario_id: null,
    });
  });

  it('debe iniciar sesión exitosamente para un becario e incluir su becario_id', async () => {
    const passwordHash = await hashearContrasena('Bumand2026!');
    usuariosServicio.obtenerPorCorreoConRelaciones!.mockResolvedValue({
      id: 3,
      nombre: 'Nilda Churata Paye',
      correo: 'nilda.churata@bumand.bo',
      contrasena_hash: passwordHash,
      rol: Rol.BECARIO,
      estado: EstadoUsuario.ACTIVO,
      becario: { id: 10 } as any,
    } as any);

    const resultado = await servicio.iniciarSesion({
      correo: 'nilda.churata@bumand.bo',
      contrasena: 'Bumand2026!',
    });

    expect(resultado.usuario.rol).toBe(Rol.BECARIO);
    expect(resultado.usuario.becario_id).toBe(10);
  });

  it('debe lanzar UnauthorizedException si las credenciales son erróneas', async () => {
    usuariosServicio.obtenerPorCorreoConRelaciones!.mockResolvedValue(null);

    await expect(
      servicio.iniciarSesion({
        correo: 'noexiste@bumand.bo',
        contrasena: 'password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException si el usuario está inactivo', async () => {
    const passwordHash = await hashearContrasena('Bumand2026!');
    usuariosServicio.obtenerPorCorreoConRelaciones!.mockResolvedValue({
      id: 5,
      nombre: 'Usuario Inactivo',
      correo: 'inactivo@bumand.bo',
      contrasena_hash: passwordHash,
      rol: Rol.BECARIO,
      estado: EstadoUsuario.INACTIVO,
    } as any);

    await expect(
      servicio.iniciarSesion({
        correo: 'inactivo@bumand.bo',
        contrasena: 'Bumand2026!',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  describe('registrarBecario', () => {
    it('debe registrar y vincular exitosamente un usuario becario cuando el CI coincide con la lista del admin', async () => {
      const becarioRoster = {
        id: 7,
        ci: '13696496',
        nombre: 'Adai Belen Huayta Cardozo',
        usuario_id: null,
        usuario: null,
      };

      becarioRepo.find.mockResolvedValue([becarioRoster]);
      usuarioRepo.findOne.mockResolvedValue(null);

      const resultado = await servicio.registrarBecario({
        ci: '13696496',
        correo: 'adaibelen017@gmail.com',
        contrasena: 'Bumand2026!',
      });

      expect(resultado.mensaje).toContain('vinculado');
      expect(resultado.token).toBe('jwt_token_simulado');
      expect(resultado.usuario.rol).toBe(Rol.BECARIO);
      expect(resultado.usuario.becario_id).toBe(7);
      expect(becarioRoster.usuario_id).toBe(99);
    });

    it('debe rechazar con NotFoundException si el CI no coincide con ningún becario registrado por el admin', async () => {
      becarioRepo.find.mockResolvedValue([
        { id: 1, ci: '1234567', usuario_id: null },
      ]);

      await expect(
        servicio.registrarBecario({
          ci: '9999999',
          correo: 'noexiste@gmail.com',
          contrasena: 'Bumand2026!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar con ConflictException si el becario ya cuenta con usuario activo', async () => {
      becarioRepo.find.mockResolvedValue([
        {
          id: 5,
          ci: '10028341',
          nombre: 'Nilda Churata',
          usuario_id: 15,
          usuario: { id: 15, correo: 'nilda@bumand.bo' },
        },
      ]);

      await expect(
        servicio.registrarBecario({
          ci: '10028341',
          correo: 'nuevo@correo.com',
          contrasena: 'Bumand2026!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar con ConflictException si el correo ya se encuentra registrado', async () => {
      becarioRepo.find.mockResolvedValue([
        { id: 2, ci: '9160054', usuario_id: null, usuario: null },
      ]);
      usuarioRepo.findOne.mockResolvedValue({ id: 80, correo: 'ya_existe@correo.com' });

      await expect(
        servicio.registrarBecario({
          ci: '9160054',
          correo: 'ya_existe@correo.com',
          contrasena: 'Bumand2026!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verificarCi', () => {
    it('debe indicar que el CI existe y está disponible para registro', async () => {
      becarioRepo.find.mockResolvedValue([
        { id: 1, ci: '13696496', nombre: 'Adai Belen Huayta', usuario_id: null, carrera: 'Ingeniería', universidad: 'UMSA' },
      ]);

      const res = await servicio.verificarCi('13696496');
      expect(res.existe).toBe(true);
      expect(res.ya_registrado).toBe(false);
      expect(res.nombre).toBe('Adai Belen Huayta');
    });

    it('debe indicar que el CI no figura en la nómina oficial', async () => {
      becarioRepo.find.mockResolvedValue([
        { id: 1, ci: '13696496', nombre: 'Adai Belen Huayta', usuario_id: null },
      ]);

      const res = await servicio.verificarCi('9999999');
      expect(res.existe).toBe(false);
      expect(res.ya_registrado).toBe(false);
    });

    it('debe indicar si el becario ya cuenta con usuario activo', async () => {
      becarioRepo.find.mockResolvedValue([
        {
          id: 1,
          ci: '13696496',
          nombre: 'Adai Belen Huayta',
          usuario_id: 10,
          usuario: { correo: 'adaibelen@gmail.com' },
        },
      ]);

      const res = await servicio.verificarCi('13696496');
      expect(res.existe).toBe(true);
      expect(res.ya_registrado).toBe(true);
      expect(res.correo).toBe('adaibelen@gmail.com');
    });
  });
});
