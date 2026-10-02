import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AutenticacionServicio } from './autenticacion.servicio';
import { UsuariosServicio } from '../usuarios/usuarios.servicio';
import { Rol, EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
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
  let jwtService: any;

  beforeEach(async () => {
    usuariosServicio = {
      obtenerPorCorreoConRelaciones: jest.fn(),
    };

    jwtService = new (JwtService as any)();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutenticacionServicio,
        { provide: UsuariosServicio, useValue: usuariosServicio },
        { provide: JwtService, useValue: jwtService },
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
});
