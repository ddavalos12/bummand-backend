import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BecariosServicio } from './becarios.servicio';
import { Becario } from './entidades/becario.entidad';
import { Usuario, Rol, EstadoUsuario } from '../usuarios/entidades/usuario.entidad';
import { ExcepcionBumand } from '../../nucleo/errores/excepcion-bumand';
import { CODIGOS_ERROR } from '../../nucleo/errores/codigos-error.constante';

describe('BecariosServicio', () => {
  let servicio: BecariosServicio;
  let becario_repo: any;
  let usuario_repo: any;

  beforeEach(async () => {
    becario_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d })),
      update: jest.fn().mockResolvedValue({}),
    };

    usuario_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d })),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        BecariosServicio,
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
        { provide: getRepositoryToken(Usuario), useValue: usuario_repo },
      ],
    }).compile();

    servicio = modulo.get<BecariosServicio>(BecariosServicio);
  });

  describe('Asignación de Supervisor', () => {
    it('debe rechazar la asignación si el supervisor no existe o no tiene rol adecuado', async () => {
      usuario_repo.findOne.mockResolvedValue(null);

      await expect(servicio.asignarSupervisor(1, 99)).rejects.toThrow(BadRequestException);
    });

    it('debe asignar supervisor correctamente si es SUPERVISOR y está ACTIVO', async () => {
      const supervisor_mock: Partial<Usuario> = {
        id: 2,
        rol: Rol.SUPERVISOR,
        estado: EstadoUsuario.ACTIVO,
      };
      const becario_mock: Partial<Becario> = {
        id: 1,
        usuario_id: 10,
        supervisor_id: null,
      };

      usuario_repo.findOne.mockResolvedValue(supervisor_mock);
      becario_repo.findOne.mockResolvedValue(becario_mock);

      const resultado = await servicio.asignarSupervisor(1, 2);

      expect(resultado.supervisor_id).toBe(2);
      expect(becario_repo.save).toHaveBeenCalled();
    });
  });

  describe('Protección de campos y RBAC en actualización', () => {
    it('debe rechazar con ERR-AUTORIZACION-0001 si un BECARIO intenta modificar universidad', async () => {
      const becario_mock: Partial<Becario> = {
        id: 5,
        usuario_id: 10,
        universidad: 'UMSA',
      };
      becario_repo.findOne.mockResolvedValue(becario_mock);

      try {
        await servicio.actualizar(
          5,
          { universidad: 'UCB' },
          Rol.BECARIO,
          10,
        );
        fail('Debería haber lanzado ExcepcionBumand');
      } catch (error) {
        expect(error).toBeInstanceOf(ExcepcionBumand);
        expect((error as ExcepcionBumand).codigo_error).toBe(CODIGOS_ERROR.ERR_AUTORIZACION_0001);
      }
    });

    it('debe rechazar con ERR-AUTORIZACION-0001 si un BECARIO intenta modificar supervisor_id o lugar_practica_id', async () => {
      const becario_mock: Partial<Becario> = {
        id: 5,
        usuario_id: 10,
      };
      becario_repo.findOne.mockResolvedValue(becario_mock);

      await expect(
        servicio.actualizar(5, { supervisor_id: 2 }, Rol.BECARIO, 10),
      ).rejects.toThrow(ExcepcionBumand);
    });

    it('debe permitir que un ADMINISTRADOR modifique campos protegidos', async () => {
      const becario_mock: Partial<Becario> = {
        id: 5,
        usuario_id: 10,
        universidad: 'UMSA',
      };
      becario_repo.findOne.mockResolvedValue(becario_mock);

      const actualizado = await servicio.actualizar(
        5,
        { universidad: 'UPB' },
        Rol.ADMINISTRADOR,
        1,
      );

      expect(actualizado.universidad).toBe('UPB');
      expect(becario_repo.save).toHaveBeenCalled();
    });

    it('debe rechazar si un becario intenta modificar el registro de otro becario', async () => {
      const becario_mock: Partial<Becario> = {
        id: 5,
        usuario_id: 10,
      };
      becario_repo.findOne.mockResolvedValue(becario_mock);

      await expect(
        servicio.actualizar(5, { telefono: '77788899' }, Rol.BECARIO, 99),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Confirmación y validación de datos', () => {
    it('debe registrar orden de confirmación de datos mensual', async () => {
      const res = await servicio.ordenConfirmacionDatos(true);

      expect(res.confirmacion_datos_requerida).toBe(true);
      expect(res.mensaje).toContain('activada');
      expect(becario_repo.update).toHaveBeenCalled();
    });

    it('debe validar datos de un becario por parte del administrador', async () => {
      const becario_mock: Partial<Becario> = {
        id: 1,
        datos_validados: false,
      };
      becario_repo.findOne.mockResolvedValue(becario_mock);

      const res = await servicio.validarDatos(1);
      expect(res.datos_validados).toBe(true);
      expect(becario_repo.save).toHaveBeenCalled();
    });

    it('debe confirmar datos propios del becario', async () => {
      const becario_mock: Partial<Becario> = {
        id: 1,
        usuario_id: 15,
        datos_confirmados: false,
      };
      becario_repo.findOne.mockResolvedValue(becario_mock);

      const res = await servicio.confirmarDatosPropios(15);
      expect(res.becario.datos_confirmados).toBe(true);
      expect(res.becario.fecha_ultima_confirmacion).toBeDefined();
      expect(becario_repo.save).toHaveBeenCalled();
    });
  });
});
