import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RefrigeriosServicio } from './refrigerios.servicio';
import { Refrigerio } from './entidades/refrigerio.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Usuario } from '../usuarios/entidades/usuario.entidad';
import { NotificacionesServicio } from '../notificaciones/notificaciones.servicio';

describe('RefrigeriosServicio', () => {
  let servicio: RefrigeriosServicio;
  let refrigerio_repo: any;
  let becario_repo: any;
  let usuario_repo: any;
  let notificaciones_servicio: any;

  beforeEach(async () => {
    refrigerio_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: d.id || 1 })),
      remove: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };

    becario_repo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([
        { id: 1, nombre: 'Nilda Churata', usuario_id: 11, usuario: { id: 11, nombre: 'Nilda Churata' } },
        { id: 2, nombre: 'Joel Mamani', usuario_id: 12, usuario: { id: 12, nombre: 'Joel Mamani' } },
        { id: 3, nombre: 'Carlos Luna', usuario_id: 13, usuario: { id: 13, nombre: 'Carlos Luna' } },
      ]),
    };

    usuario_repo = {
      findOne: jest.fn(),
    };

    notificaciones_servicio = {
      crear: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        RefrigeriosServicio,
        { provide: getRepositoryToken(Refrigerio), useValue: refrigerio_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
        { provide: getRepositoryToken(Usuario), useValue: usuario_repo },
        { provide: NotificacionesServicio, useValue: notificaciones_servicio },
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

  describe('Sorteo y Asignación de Duplas (TAREA-15)', () => {
    it('debe sortear aleatoriamente 2 becarios distintos cuando no se especifican IDs', async () => {
      refrigerio_repo.find.mockResolvedValue([]);

      const resultado = await servicio.sortearDupla(
        { fecha: '2026-10-30', cantidad_raciones: 23, presupuesto_referencial_bs: 138.0 },
        1,
      );

      expect(resultado).toBeDefined();
      expect(refrigerio_repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cantidad_raciones: 23,
          presupuesto_referencial_bs: 138.0,
          modalidad_preparacion: 'cocina_diaconia',
          estado_reposicion: 'sorteado_programado',
          porcentaje_devolucion: 100.0,
        }),
      );
      expect(notificaciones_servicio.crear).toHaveBeenCalled();
    });

    it('debe asignar la dupla manualmente si se especifican los IDs', async () => {
      becario_repo.findOne
        .mockResolvedValueOnce({ id: 1, nombre: 'Nilda Churata', usuario_id: 11 })
        .mockResolvedValueOnce({ id: 2, nombre: 'Joel Mamani', usuario_id: 12 });

      const resultado = await servicio.sortearDupla(
        {
          fecha: '2026-10-30',
          becario_encargado_1_id: 1,
          becario_encargado_2_id: 2,
        },
        1,
      );

      expect(resultado).toBeDefined();
      expect(refrigerio_repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          becario_encargado_1_id: 1,
          becario_encargado_2_id: 2,
        }),
      );
    });

    it('debe rechazar si se intenta asignar al mismo becario dos veces', async () => {
      await expect(
        servicio.sortearDupla(
          { fecha: '2026-10-30', becario_encargado_1_id: 1, becario_encargado_2_id: 1 },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Rendición y Estados del Refrigerio (TAREA-15)', () => {
    it('debe registrar la rendición con modalidad, ingredientes y 100% de devolución', async () => {
      const refrigerio_existente = {
        id: 5,
        cantidad_raciones: 23,
        costo_total_bs: 0,
        estado_reposicion: 'sorteado_programado',
      };
      refrigerio_repo.findOne.mockResolvedValue(refrigerio_existente);

      const dto = {
        descripcion: 'Sándwiches de huevo y jugo',
        modalidad_preparacion: 'cocina_diaconia',
        detalle_ingredientes: [
          { insumo: 'Pan', costo_bs: 30, pagado_por_becario_id: 1, pagado_por_nombre: 'Nilda' },
          { insumo: 'Huevos', costo_bs: 40, pagado_por_becario_id: 2, pagado_por_nombre: 'Joel' },
        ],
        costo_total_bs: 70,
        cantidad_raciones: 23,
      };

      const res = await servicio.rendirRefrigerio(5, dto);

      expect(res.costo_total_bs).toBe(70);
      expect(res.monto_devolucion_bs).toBe(70);
      expect(res.porcentaje_devolucion).toBe(100.0);
      expect(res.estado_reposicion).toBe('rendido_pendiente');
      expect(refrigerio_repo.save).toHaveBeenCalled();
    });

    it('debe permitir la revisión por supervisor', async () => {
      const refrigerio_existente = {
        id: 5,
        estado_reposicion: 'rendido_pendiente',
      };
      refrigerio_repo.findOne.mockResolvedValue(refrigerio_existente);

      const res = await servicio.revisarSupervisor(5, { observacion: 'Insumos verificados' }, 2);

      expect(res.estado_reposicion).toBe('revisado_supervisor');
      expect(res.revisado_por_supervisor_id).toBe(2);
      expect(res.observacion_supervisor).toBe('Insumos verificados');
      expect(refrigerio_repo.save).toHaveBeenCalled();
    });

    it('debe aprobar por administración registrando al becario receptor del 100% del reembolso', async () => {
      const refrigerio_existente = {
        id: 5,
        fecha: new Date('2026-10-30'),
        costo_total_bs: 135,
        becario_encargado_1_id: 1,
        becario_encargado_1_nombre: 'Nilda Churata',
        becario_encargado_2_id: 2,
        becario_encargado_2_nombre: 'Joel Mamani',
        estado_reposicion: 'revisado_supervisor',
      };
      refrigerio_repo.findOne.mockResolvedValue(refrigerio_existente);
      becario_repo.findOne.mockResolvedValue({ id: 1, usuario_id: 11 });

      const res = await servicio.aprobarAdministracion(
        5,
        {
          becario_receptor_devolucion_id: 1,
          becario_receptor_devolucion_nombre: 'Nilda Churata',
        },
        99,
      );

      expect(res.estado_reposicion).toBe('aprobado_administracion');
      expect(res.monto_devolucion_bs).toBe(135);
      expect(res.porcentaje_devolucion).toBe(100.0);
      expect(res.becario_receptor_devolucion_id).toBe(1);
      expect(res.becario_receptor_devolucion_nombre).toBe('Nilda Churata');
      expect(res.entregado_por_usuario_id).toBe(99);
      expect(refrigerio_repo.save).toHaveBeenCalled();
      expect(notificaciones_servicio.crear).toHaveBeenCalled();
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
    it('debe estructurar la planilla contable con dupla de encargados y devolución del 100%', async () => {
      const refrigerio_mock = {
        id: 7,
        fecha: new Date('2026-10-12'),
        descripcion: 'Refrigerio Escuela de Líderes',
        cantidad_raciones: 23,
        costo_unitario_bs: 6.0,
        costo_total_bs: 138.0,
        presupuesto_referencial_bs: 138.0,
        porcentaje_devolucion: 100.0,
        monto_devolucion_bs: 138.0,
        modalidad_preparacion: 'cocina_diaconia',
        becario_encargado_1_id: 1,
        becario_encargado_1_nombre: 'Nilda Churata',
        becario_encargado_2_id: 2,
        becario_encargado_2_nombre: 'Joel Mamani',
        becario_receptor_devolucion_id: 1,
        becario_receptor_devolucion_nombre: 'Nilda Churata',
        fecha_entrega_devolucion: new Date('2026-10-12T16:00:00Z'),
        entregado_por_usuario_id: 99,
        responsable_id: 3,
        responsable: { id: 3, nombre: 'Pastor Daniel', correo: 'daniel@diaconia.bo' },
        evento: { titulo: 'Jornada Pastoral' },
        lugar_practica: { nombre: 'Oficina Central' },
        detalle_ingredientes: [
          { insumo: 'Pan', costo_bs: 38 },
          { insumo: 'Huevos', costo_bs: 100 },
        ],
        firmas_conformidad: [
          { becario_id: 1, firma: 'hash1' },
          { becario_id: 2, firma: 'hash2' },
        ],
        estado_reposicion: 'aprobado_administracion',
      };

      refrigerio_repo.findOne.mockResolvedValue(refrigerio_mock);

      const planilla = await servicio.generarPlanillaReposicion(7);

      expect(planilla.codigo_formulario).toBe('REP-REF-00007');
      expect(planilla.cantidad_raciones).toBe(23);
      expect(planilla.costo_total_bs).toBe(138.0);
      expect(planilla.monto_devolucion_bs).toBe(138.0);
      expect(planilla.porcentaje_devolucion).toBe(100.0);
      expect(planilla.dupla_encargados.encargado_1.nombre).toBe('Nilda Churata');
      expect(planilla.dupla_encargados.encargado_2.nombre).toBe('Joel Mamani');
      expect(planilla.receptor_devolucion.nombre).toBe('Nilda Churata');
      expect(planilla.total_firmas).toBe(2);
      expect(planilla.estado_reposicion).toBe('aprobado_administracion');
    });
  });
});
