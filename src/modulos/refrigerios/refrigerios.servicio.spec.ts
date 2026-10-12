import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RefrigeriosServicio } from './refrigerios.servicio';
import { Refrigerio } from './entidades/refrigerio.entidad';

describe('RefrigeriosServicio', () => {
  let servicio: RefrigeriosServicio;
  let refrigerio_repo: any;

  beforeEach(async () => {
    refrigerio_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: d.id || 1 })),
      remove: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        RefrigeriosServicio,
        { provide: getRepositoryToken(Refrigerio), useValue: refrigerio_repo },
      ],
    }).compile();

    servicio = modulo.get<RefrigeriosServicio>(RefrigeriosServicio);
  });

  describe('Creación de Refrigerios', () => {
    it('debe calcular el costo total automáticamente a partir de raciones y costo unitario', async () => {
      const dto = {
        fecha: '2026-10-12',
        descripcion: 'Empanadas y refresco Escuela de Líderes',
        cantidad_raciones: 40,
        costo_unitario_bs: 6.5,
        responsable_id: 2,
      };

      const resultado = await servicio.crear(dto);

      expect(resultado.costo_total_bs).toBe(260.0);
      expect(refrigerio_repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cantidad_raciones: 40,
          costo_unitario_bs: 6.5,
          costo_total_bs: 260.0,
        }),
      );
      expect(refrigerio_repo.save).toHaveBeenCalled();
    });
  });

  describe('Consulta y Edición', () => {
    it('debe listar refrigerios', async () => {
      refrigerio_repo.find.mockResolvedValue([
        { id: 1, descripcion: 'Refrigerio A' },
        { id: 2, descripcion: 'Refrigerio B' },
      ]);

      const lista = await servicio.listar();
      expect(lista).toHaveLength(2);
      expect(refrigerio_repo.find).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el refrigerio no existe', async () => {
      refrigerio_repo.findOne.mockResolvedValue(null);

      await expect(servicio.obtenerPorId(999)).rejects.toThrow(NotFoundException);
    });

    it('debe actualizar los datos y recalcular el costo total', async () => {
      const existente: Partial<Refrigerio> = {
        id: 1,
        cantidad_raciones: 20,
        costo_unitario_bs: 5,
        costo_total_bs: 100,
      };
      refrigerio_repo.findOne.mockResolvedValue(existente);

      const res = await servicio.actualizar(1, {
        cantidad_raciones: 30,
      });

      expect(res.costo_total_bs).toBe(150); // 30 * 5
      expect(refrigerio_repo.save).toHaveBeenCalled();
    });

    it('debe eliminar un refrigerio existente', async () => {
      const existente: Partial<Refrigerio> = { id: 1 };
      refrigerio_repo.findOne.mockResolvedValue(existente);

      const res = await servicio.eliminar(1);
      expect(res.mensaje).toContain('eliminado satisfactoriamente');
      expect(refrigerio_repo.remove).toHaveBeenCalled();
    });
  });

  describe('Generación de Planilla de Reposición', () => {
    it('debe estructurar la planilla contable con código oficial y total de firmas', async () => {
      const refrigerio_mock = {
        id: 7,
        fecha: new Date('2026-10-12'),
        descripcion: 'Refrigerio reunión mensual',
        cantidad_raciones: 25,
        costo_unitario_bs: 8.0,
        costo_total_bs: 200.0,
        responsable_id: 3,
        responsable: { id: 3, nombre: 'Pastor Daniel', correo: 'daniel@diaconia.bo' },
        evento: { titulo: 'Jornada Pastoral' },
        lugar_practica: { nombre: 'Oficina Central' },
        firmas_conformidad: [
          { becario_id: 1, firma: 'hash1' },
          { becario_id: 2, firma: 'hash2' },
        ],
      };

      refrigerio_repo.findOne.mockResolvedValue(refrigerio_mock);

      const planilla = await servicio.generarPlanillaReposicion(7);

      expect(planilla.codigo_formulario).toBe('REP-REF-00007');
      expect(planilla.cantidad_raciones).toBe(25);
      expect(planilla.costo_total_bs).toBe(200.0);
      expect(planilla.total_firmas).toBe(2);
      expect(planilla.estado_reposicion).toBe('LISTO_PARA_DESEMBOLSO');
      expect(planilla.responsable.nombre).toBe('Pastor Daniel');
      expect(planilla.contexto_operativo.evento).toBe('Jornada Pastoral');
    });
  });
});
