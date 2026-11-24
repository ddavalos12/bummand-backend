import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PasajesServicio, esActividadReembolsablePasaje } from './pasajes.servicio';
import { SolicitudPasajes, EstadoSolicitud } from './entidades/solicitud-pasaje.entidad';
import { Recorrido, Tramo } from './entidades/recorrido.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Multa } from '../asistencia/entidades/multa.entidad';
import { Rol, Usuario } from '../usuarios/entidades/usuario.entidad';

describe('PasajesServicio', () => {
  let servicio: PasajesServicio;
  let solicitud_repo: any;
  let recorrido_repo: any;

  beforeEach(async () => {
    solicitud_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 1 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const qb_mock: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    recorrido_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 10 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb_mock),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        PasajesServicio,
        { provide: getRepositoryToken(SolicitudPasajes), useValue: solicitud_repo },
        { provide: getRepositoryToken(Recorrido), useValue: recorrido_repo },
      ],
    }).compile();

    servicio = modulo.get<PasajesServicio>(PasajesServicio);
  });

  describe('Cálculo estricto de reembolso del 80% en centavos', () => {
    it('debe calcular el monto total y devolución del 80% en centavos exactos sin pérdida de precisión decimal', () => {
      // Tarifas: 2.50 + 2.50 + 3.00 = 8.00 Bs. 80% = 6.40 Bs (640 centavos)
      const resultado1 = servicio.calcularReembolsoCentavos([2.5, 2.5, 3.0]);
      expect(resultado1.total_centavos).toBe(800);
      expect(resultado1.devolucion_centavos).toBe(640);
      expect(resultado1.monto_total).toBe(8.0);
      expect(resultado1.monto_devolucion).toBe(6.4);

      // Caso con decimales irregulares: 3.45 + 1.25 = 4.70 (470 centavos) -> 80% = 376 centavos = 3.76
      const resultado2 = servicio.calcularReembolsoCentavos([3.45, 1.25]);
      expect(resultado2.total_centavos).toBe(470);
      expect(resultado2.devolucion_centavos).toBe(376);
      expect(resultado2.monto_total).toBe(4.7);
      expect(resultado2.monto_devolucion).toBe(3.76);

      // Verificación de redondeo financiero de centavo: 1.01 Bs -> 101 centavos * 0.8 = 80.8 -> 81 centavos = 0.81 Bs
      const resultado3 = servicio.calcularReembolsoCentavos([1.01]);
      expect(resultado3.total_centavos).toBe(101);
      expect(resultado3.devolucion_centavos).toBe(81);
      expect(resultado3.monto_devolucion).toBe(0.81);
    });

    it('debe actualizar los montos de la solicitud en base al cálculo en centavos al agregar recorrido', async () => {
      solicitud_repo.findOne.mockResolvedValue({
        id: 1,
        becario_id: 5,
        estado: EstadoSolicitud.BORRADOR,
        monto_total: 0,
        monto_devolucion: 0,
      });

      recorrido_repo.find.mockResolvedValue([
        { tarifa: 2.5 },
        { tarifa: 2.5 },
      ]);

      await servicio.agregarRecorrido({
        becario_id: 5,
        fecha: '2026-09-24',
        tramo: Tramo.IDA,
        origen: 'Zona 16 de Julio',
        destino: 'Oficina Central',
        tarifa: 2.5,
      });

      expect(solicitud_repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          monto_total: 5.0,
          monto_devolucion: 4.0,
        }),
      );
    });
  });

  describe('Regla institucional del día 24 para envío formal', () => {
    it('debe lanzar BadRequestException si el envío formal se intenta antes del día 24 del mes', async () => {
      const fecha_antes_24 = new Date(2026, 8, 23, 10, 0, 0); // 23 de septiembre de 2026

      solicitud_repo.findOne.mockResolvedValue({
        id: 1,
        becario_id: 5,
        estado: EstadoSolicitud.BORRADOR,
        recorridos: [{ id: 1, tarifa: 2.5 }],
      });

      await expect(
        servicio.enviarSolicitud(1, 5, fecha_antes_24),
      ).rejects.toThrow(BadRequestException);

      await expect(
        servicio.enviarSolicitud(1, 5, fecha_antes_24),
      ).rejects.toThrow(/El envío formal de la solicitud de pasajes solo está permitido a partir del día 24/);
    });

    it('debe permitir el envío formal a partir del día 24 del mes y cambiar estado a PENDIENTE', async () => {
      const fecha_dia_24 = new Date(2026, 8, 24, 8, 30, 0); // 24 de septiembre de 2026

      solicitud_repo.findOne.mockResolvedValue({
        id: 1,
        becario_id: 5,
        estado: EstadoSolicitud.BORRADOR,
        recorridos: [{ id: 1, tarifa: 2.5 }],
      });

      const resultado = await servicio.enviarSolicitud(1, 5, fecha_dia_24);

      expect(resultado.estado).toBe(EstadoSolicitud.PENDIENTE);
      expect(resultado.fecha_envio).toBe(fecha_dia_24);
      expect(solicitud_repo.save).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si la solicitud no tiene recorridos', async () => {
      const fecha_dia_25 = new Date(2026, 8, 25, 9, 0, 0);

      solicitud_repo.findOne.mockResolvedValue({
        id: 1,
        becario_id: 5,
        estado: EstadoSolicitud.BORRADOR,
        recorridos: [],
      });

      await expect(
        servicio.enviarSolicitud(1, 5, fecha_dia_25),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si la solicitud no existe', async () => {
      solicitud_repo.findOne.mockResolvedValue(null);

      await expect(
        servicio.enviarSolicitud(999, 5),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Catálogo de paradas sin catálogo predefinido', () => {
    it('debe retornar [] cuando no existen paradas personalizadas en BD (sin fallback predefinido)', async () => {
      const paradas = await servicio.obtenerParadas();
      expect(paradas).toEqual([]);
      expect(await servicio.sembrarParadas()).toEqual([]);
    });

    it('debe retornar y filtrar únicamente paradas personalizadas guardadas en BD', async () => {
      const parada_repo_mock = {
        find: jest.fn().mockImplementation(({ where }: any) => {
          const filas = [
            { id: 1, nombre: 'Parada Personalizada LP', ciudad: 'La Paz', latitud: -16.5, longitud: -68.13 },
            { id: 2, nombre: 'Parada Personalizada EA', ciudad: 'El Alto', latitud: -16.51, longitud: -68.16 },
          ];
          return Promise.resolve(where?.ciudad ? filas.filter((f) => f.ciudad === where.ciudad) : filas);
        }),
      };
      const servicio_con_paradas = new PasajesServicio(
        solicitud_repo,
        recorrido_repo,
        undefined,
        parada_repo_mock as any,
      );

      const paradas_el_alto = await servicio_con_paradas.obtenerParadas('El Alto');
      expect(paradas_el_alto).toHaveLength(1);
      expect(paradas_el_alto[0].ciudad).toBe('El Alto');

      const paradas_la_paz = await servicio_con_paradas.obtenerParadas('La Paz');
      expect(paradas_la_paz).toHaveLength(1);
      expect(paradas_la_paz[0].ciudad).toBe('La Paz');
    });
  });

  describe('Tarifario institucional con vigencia temporal y retroactividad', () => {
    it('debe retornar tarifas vigentes a la fecha solicitada', async () => {
      const tarifas = await servicio.obtenerTarifasOficiales('2026-10-11');
      expect(tarifas.length).toBeGreaterThan(0);
      expect(tarifas.some((t) => t.costo_bs === 2.60)).toBe(true);
      expect(tarifas.every((t) => t.activo)).toBe(true);
    });

    it('debe permitir consultar el catálogo completo para administración', async () => {
      const todas = await servicio.listarTodasLasTarifas();
      expect(todas.length).toBeGreaterThan(0);
    });
  });

  describe('Trazabilidad de calles, medios de transporte y teleférico en recorridos', () => {
    it('debe persistir calles_declaradas, medio_transporte y detalle_tramos_json al agregar un recorrido', async () => {
      solicitud_repo.findOne.mockResolvedValue({
        id: 1,
        becario_id: 5,
        estado: EstadoSolicitud.BORRADOR,
        monto_total: 0,
        monto_devolucion: 0,
      });

      recorrido_repo.find.mockResolvedValue([]);

      await servicio.agregarRecorrido({
        becario_id: 5,
        fecha: '2026-09-24',
        tramo: Tramo.IDA,
        origen: 'Estación 16 de Julio (Línea Roja)',
        destino: 'Oficina Central Diaconía',
        tarifa: 3.0,
        calles_declaradas: 'Av. Panorámica, Estación Central, Av. Montes',
        medio_transporte: 'Mi Teleférico',
        detalle_tramos_json: JSON.stringify([{ tramo: 1, linea: 'Roja', costo: 3.0 }]),
      });

      expect(recorrido_repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          calles_declaradas: 'Av. Panorámica, Estación Central, Av. Montes',
          medio_transporte: 'Mi Teleférico',
          detalle_tramos_json: JSON.stringify([{ tramo: 1, linea: 'Roja', costo: 3.0 }]),
        }),
      );
      expect(recorrido_repo.save).toHaveBeenCalled();
    });

    it('debe permitir agregar múltiples recorridos con agregarRecorridos', async () => {
      solicitud_repo.findOne.mockResolvedValue({
        id: 1,
        becario_id: 5,
        estado: EstadoSolicitud.BORRADOR,
        monto_total: 0,
        monto_devolucion: 0,
      });

      recorrido_repo.find.mockResolvedValue([]);

      const items = [
        {
          becario_id: 5,
          fecha: '2026-09-24',
          tramo: Tramo.IDA,
          origen: 'Ceja El Alto',
          destino: 'Sede Central',
          tarifa: 2.5,
          calles_declaradas: 'Av. 6 de Marzo',
          medio_transporte: 'Minibús',
        },
        {
          becario_id: 5,
          fecha: '2026-09-24',
          tramo: Tramo.VUELTA,
          origen: 'Sede Central',
          destino: 'Ceja El Alto',
          tarifa: 2.5,
          calles_declaradas: 'Autopista La Paz - El Alto',
          medio_transporte: 'Minibús',
        },
      ];

      const resultado = await servicio.agregarRecorridos(items);
      expect(resultado).toHaveLength(2);
      expect(recorrido_repo.create).toHaveBeenCalledTimes(2);
    });

    it('debe retornar los campos de trazabilidad en obtenerTodas y obtenerPorId', async () => {
      solicitud_repo.find.mockResolvedValue([
        {
          id: 1,
          monto_total: 6.0,
          monto_devolucion: 4.8,
          recorridos: [
            {
              id: 10,
              tarifa: 3.0,
              calles_declaradas: 'Av. Busch, Plaza Villarroel',
              medio_transporte: 'Mi Teleférico',
              detalle_tramos_json: '{"linea":"Blanca"}',
            },
          ],
        },
      ]);

      const todas = await servicio.obtenerTodas();
      expect(todas[0].recorridos[0].calles_declaradas).toBe('Av. Busch, Plaza Villarroel');
      expect(todas[0].recorridos[0].medio_transporte).toBe('Mi Teleférico');
      expect(todas[0].recorridos[0].detalle_tramos_json).toBe('{"linea":"Blanca"}');

      solicitud_repo.findOne.mockResolvedValue({
        id: 1,
        monto_total: 6.0,
        monto_devolucion: 4.8,
        recorridos: [
          {
            id: 10,
            tarifa: 3.0,
            calles_declaradas: 'Av. Busch, Plaza Villarroel',
            medio_transporte: 'Mi Teleférico',
            detalle_tramos_json: '{"linea":"Blanca"}',
          },
        ],
      });

      const una = await servicio.obtenerPorId(1);
      expect(una.recorridos[0].calles_declaradas).toBe('Av. Busch, Plaza Villarroel');
      expect(una.recorridos[0].medio_transporte).toBe('Mi Teleférico');
    });
  });

  describe('Historial de paradas por estudiante en intervalo de tiempo', () => {
    it('debe recuperar el historial de paradas, secuencia y métricas consolidadas', async () => {
      recorrido_repo.createQueryBuilder().getMany.mockResolvedValueOnce([
        {
          id: 101,
          solicitud_id: 1,
          fecha: '2026-10-02',
          tramo: Tramo.IDA,
          origen: 'La Ceja - Calle 1',
          destino: 'Pérez Velasco',
          calles_declaradas: 'La Ceja - Calle 1 → Autopista LP-EA → Av. Montes → Pérez Velasco',
          medio_transporte: 'Minibús Interciudad',
          tipo_actividad: 'practicas',
          apoyo_realizado: 'Conciliación de expedientes',
          tarifa: 3.5,
          solicitud: { periodo: 'Octubre 2026' },
        },
        {
          id: 102,
          solicitud_id: 1,
          fecha: '2026-10-02',
          tramo: Tramo.VUELTA,
          origen: 'Pérez Velasco',
          destino: 'La Ceja - Calle 1',
          calles_declaradas: 'Pérez Velasco → Av. Montes → Autopista LP-EA → La Ceja - Calle 1',
          medio_transporte: 'Minibús Interciudad',
          tipo_actividad: 'practicas',
          apoyo_realizado: 'Retorno de jornada',
          tarifa: 3.5,
          solicitud: { periodo: 'Octubre 2026' },
        },
      ]);

      const resultado = await servicio.obtenerHistorialParadasEstudiante({
        id_estudiante: 1,
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-15',
        tramo: 'todos',
      });

      expect(resultado).toBeDefined();
      expect(resultado.becario).toBeDefined();
      expect(resultado.intervalo.fecha_inicio).toBe('2026-10-01');
      expect(resultado.intervalo.fecha_fin).toBe('2026-10-15');
      expect(resultado.resumen.total_recorridos).toBeGreaterThan(0);
      expect(resultado.resumen.paradas_unicas_frecuentes.length).toBeGreaterThan(0);
      expect(resultado.historial.length).toBeGreaterThan(0);

      // Verificar que cada registro contenga la secuencia de paradas
      const primer_item = resultado.historial[0];
      expect(primer_item.paradas_secuencia).toBeDefined();
      expect(primer_item.paradas_secuencia.length).toBeGreaterThanOrEqual(2);
      expect(primer_item.origen).toBeDefined();
      expect(primer_item.destino).toBeDefined();
    });

    it('debe excluir recorridos de escuela_lideres en obtenerHistorialParadasEstudiante', async () => {
      recorrido_repo.createQueryBuilder().getMany.mockResolvedValueOnce([
        {
          id: 201,
          solicitud_id: 1,
          fecha: '2026-10-05',
          tramo: Tramo.IDA,
          origen: 'Villa Adela',
          destino: 'Cruce Viacha',
          calles_declaradas: 'Villa Adela → Av. Bolivia → Cruce Viacha',
          medio_transporte: 'Minibús Tramo Corto',
          tipo_actividad: 'practicas',
          tarifa: 2.0,
          solicitud: { periodo: 'Octubre 2026' },
        },
        {
          id: 202,
          solicitud_id: 1,
          fecha: '2026-10-06',
          tramo: Tramo.IDA,
          origen: 'Obelisco',
          destino: 'Auditorio Central',
          calles_declaradas: 'Obelisco → Auditorio Central',
          medio_transporte: 'Minibús Urbano',
          tipo_actividad: 'escuela_lideres',
          tarifa: 3.0,
          solicitud: { periodo: 'Octubre 2026' },
        },
      ]);

      const resultado = await servicio.obtenerHistorialParadasEstudiante({
        id_estudiante: 1,
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-15',
        tramo: 'todos',
      });

      expect(resultado.resumen.total_recorridos).toBe(1);
      expect(resultado.historial).toHaveLength(1);
      expect(resultado.historial[0].id).toBe(201);
      expect(resultado.historial[0].tipo_actividad).toBe('practicas');
    });
  });

  describe('Flujo de 2 Pasos en Pasajes (Supervisor y Administración)', () => {
    it('debe permitir la revisión del supervisor', async () => {
      const solicitud_mock = {
        id: 1,
        becario_id: 2,
        periodo: 'Septiembre 2026',
        estado: EstadoSolicitud.PENDIENTE,
      };

      solicitud_repo.findOne.mockResolvedValue(solicitud_mock);

      const resultado = await servicio.revisarSupervisor(1, 10, {
        estado: EstadoSolicitud.REVISADO_SUPERVISOR,
        observacion_supervisor: 'Tramos y distancias revisados correctamente',
      });

      expect(resultado.estado).toBe(EstadoSolicitud.REVISADO_SUPERVISOR);
      expect(resultado.revisado_por_supervisor_id).toBe(10);
      expect(resultado.fecha_revision_supervisor).toBeInstanceOf(Date);
      expect(resultado.observacion_supervisor).toBe('Tramos y distancias revisados correctamente');
    });

    it('debe permitir la aprobación final por parte de administración', async () => {
      const solicitud_mock = {
        id: 1,
        becario_id: 2,
        periodo: 'Septiembre 2026',
        estado: EstadoSolicitud.REVISADO_SUPERVISOR,
      };

      solicitud_repo.findOne.mockResolvedValue(solicitud_mock);

      const resultado = await servicio.aprobarAdministracion(1, 1, {
        estado: EstadoSolicitud.APROBADO_ADMINISTRACION,
        observacion_admin: 'Planilla aprobada para desembolso financiero',
      });

      expect(resultado.estado).toBe(EstadoSolicitud.APROBADO_ADMINISTRACION);
      expect(resultado.aprobado_por_admin_id).toBe(1);
      expect(resultado.fecha_aprobacion_admin).toBeInstanceOf(Date);
      expect(resultado.observacion_admin).toBe('Planilla aprobada para desembolso financiero');
    });
  });

  describe('Exclusión de Escuela de Líderes del reembolso del 80%', () => {
    it('esActividadReembolsablePasaje rechaza variantes de Escuela de Líderes y permite prácticas/acciones', () => {
      expect(esActividadReembolsablePasaje('escuela_lideres')).toBe(false);
      expect(esActividadReembolsablePasaje('Escuela de Líderes')).toBe(false);
      expect(esActividadReembolsablePasaje('ESCUELA DE LIDERES')).toBe(false);
      expect(esActividadReembolsablePasaje('practicas')).toBe(true);
      expect(esActividadReembolsablePasaje('acciones_servicio')).toBe(true);
      expect(esActividadReembolsablePasaje(undefined)).toBe(true);
    });

    it('rechaza con BadRequestException el registro de recorridos de Escuela de Líderes', async () => {
      await expect(
        servicio.agregarRecorrido({
          becario_id: 5,
          fecha: '2026-10-16',
          tramo: Tramo.IDA,
          origen: 'Obelisco',
          destino: 'Auditorio Central',
          tarifa: 3.0,
          tipo_actividad: 'escuela_lideres',
        }),
      ).rejects.toThrow(
        'Los pasajes de Escuela de Líderes no son reembolsables. Solo se reconocen Prácticas Pre Profesionales o Acciones de Servicio.',
      );
    });

    it('excluye recorridos históricos de Escuela de Líderes al recalcular 80% en agregarRecorrido y obtenerTodas', async () => {
      solicitud_repo.findOne.mockResolvedValue({
        id: 1,
        becario_id: 5,
        estado: EstadoSolicitud.BORRADOR,
        monto_total: 0,
        monto_devolucion: 0,
      });
      recorrido_repo.find.mockResolvedValue([
        { tarifa: 10.0, tipo_actividad: 'practicas' },
        { tarifa: 50.0, tipo_actividad: 'escuela_lideres' },
      ]);

      await servicio.agregarRecorrido({
        becario_id: 5,
        fecha: '2026-10-16',
        tramo: Tramo.IDA,
        origen: 'Ceja',
        destino: 'Centro',
        tarifa: 10.0,
        tipo_actividad: 'practicas',
      });

      expect(solicitud_repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          monto_total: 10.0,
          monto_devolucion: 8.0,
        }),
      );

      solicitud_repo.find.mockResolvedValue([
        {
          id: 2,
          becario_id: 5,
          monto_total: 60.0,
          monto_devolucion: 48.0,
          recorridos: [
            { id: 1, tarifa: 10.0, tipo_actividad: 'practicas' },
            { id: 2, tarifa: 50.0, tipo_actividad: 'Escuela de Líderes' },
          ],
        },
      ]);

      const solicitudes = await servicio.obtenerTodas();
      expect(solicitudes[0].monto_total).toBe(10.0);
      expect(solicitudes[0].monto_devolucion).toBe(8.0);
      expect(solicitudes[0].recorridos).toHaveLength(1);
    });
  });

  describe('Cálculo de pago de pasajes de Prácticas sin descuento de multas (calcularPagoPasajesConMultas)', () => {
    let servicio_con_multas: PasajesServicio;
    let solicitud_repo_m: any;
    let recorrido_repo_m: any;
    let becario_repo_m: any;
    let multa_repo_m: any;

    beforeEach(async () => {
      solicitud_repo_m = {
        find: jest.fn(),
        findOne: jest.fn(),
      };
      const qb_rec_m: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      recorrido_repo_m = {
        find: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnValue(qb_rec_m),
      };
      becario_repo_m = {
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn(),
      };
      multa_repo_m = {
        find: jest.fn(),
      };

      const modulo: TestingModule = await Test.createTestingModule({
        providers: [
          PasajesServicio,
          { provide: getRepositoryToken(SolicitudPasajes), useValue: solicitud_repo_m },
          { provide: getRepositoryToken(Recorrido), useValue: recorrido_repo_m },
          { provide: getRepositoryToken(Becario), useValue: becario_repo_m },
          { provide: getRepositoryToken(Multa), useValue: multa_repo_m },
        ],
      }).compile();

      servicio_con_multas = modulo.get<PasajesServicio>(PasajesServicio);
    });

    it('mantiene multas_asistencia_bs en 0 y líquido igual al 80% en pasajes de Prácticas incluso si existen multas de Escuela de Líderes', async () => {
      solicitud_repo_m.find.mockResolvedValue([
        {
          id: 1,
          becario_id: 10,
          periodo: 'Octubre 2026',
          estado: EstadoSolicitud.APROBADO,
          becario: {
            id: 10,
            ci: '9123841 LP',
            carrera: 'Contabilidad',
            usuario: { nombre: 'Aruquipa Mamani Juan Carlos' },
            lugar_practica: { nombre: 'Oficina Central' },
          },
          recorridos: [
            { id: 1, fecha: '2026-10-05', tarifa: 50, tipo_actividad: 'practicas' },
            { id: 2, fecha: '2026-10-12', tarifa: 50, tipo_actividad: 'acciones_servicio' },
            { id: 3, fecha: '2026-10-16', tarifa: 30, tipo_actividad: 'escuela_lideres' },
          ],
        },
        {
          id: 2,
          becario_id: 20,
          periodo: 'Octubre 2026',
          estado: EstadoSolicitud.APROBADO,
          becario: {
            id: 20,
            ci: '8492018 LP',
            carrera: 'Economía',
            usuario: { nombre: 'Condori Quispe Maria Belen' },
            lugar_practica: { nombre: 'Agencia El Alto' },
          },
          recorridos: [
            { id: 4, fecha: '2026-10-08', tarifa: 20, tipo_actividad: 'practicas' },
          ],
        },
      ]);

      multa_repo_m.find.mockResolvedValue([
        {
          id: 101,
          becario_id: 10,
          fecha_aplicacion: new Date('2026-10-09T14:50:00Z'),
          minutos_retraso: 20,
          monto_bs: 20,
          motivo: 'Retraso 20 min Escuela de Líderes',
        },
        {
          id: 103,
          becario_id: 20,
          fecha_aplicacion: new Date('2026-10-16T15:15:00Z'),
          minutos_retraso: 45,
          monto_bs: 30,
          motivo: 'Retraso mayor a 30 min',
        },
      ]);

      const por_defecto = await servicio_con_multas.calcularPagoPasajesConMultas({
        periodo: '2026-10',
      });

      expect(por_defecto.filtros.descontar_multas).toBe(false);
      expect(por_defecto.resumen).toEqual({
        descontar_multas: false,
        total_becarios: 2,
        total_100_bs: 120,
        total_80_bs: 96,
        total_multas_bs: 0,
        total_descuento_aplicado_bs: 0,
        total_liquido_pagable_bs: 96,
      });

      const bec1 = por_defecto.becarios.find((b) => b.becario_id === 10)!;
      expect(bec1.monto_total_100_bs).toBe(100);
      expect(bec1.monto_reconocido_80_bs).toBe(80);
      expect(bec1.multas_asistencia_bs).toBe(0);
      expect(bec1.descuento_multas_aplicado_bs).toBe(0);
      expect(bec1.monto_liquido_pagable_bs).toBe(80);
      expect(bec1.cantidad_multas).toBe(0);
      expect(bec1.detalle_multas).toEqual([]);

      const bec2 = por_defecto.becarios.find((b) => b.becario_id === 20)!;
      expect(bec2.monto_reconocido_80_bs).toBe(16);
      expect(bec2.multas_asistencia_bs).toBe(0);
      expect(bec2.descuento_multas_aplicado_bs).toBe(0);
      expect(bec2.monto_liquido_pagable_bs).toBe(16);

      const incluso_con_true = await servicio_con_multas.calcularPagoPasajesConMultas({
        periodo: '2026-10',
        descontar_multas: 'true',
      });
      expect(incluso_con_true.resumen.descontar_multas).toBe(false);
      expect(incluso_con_true.resumen.total_multas_bs).toBe(0);
      expect(incluso_con_true.resumen.total_liquido_pagable_bs).toBe(96);
    });

    it('no descuenta multas en obtenerTodas, obtenerPorId ni obtenerHistorialParadasEstudiante para Prácticas', async () => {
      multa_repo_m.find.mockResolvedValue([
        { id: 1, becario_id: 10, monto_bs: 40, motivo: 'Retraso Escuela de Líderes' },
      ]);
      const solicitud_practicas = {
        id: 1,
        becario_id: 10,
        monto_total: 100,
        monto_devolucion: 80,
        recorridos: [{ id: 1, tarifa: 100, tipo_actividad: 'practicas' }],
      };
      solicitud_repo_m.find.mockResolvedValue([solicitud_practicas]);
      solicitud_repo_m.findOne.mockResolvedValue(solicitud_practicas);
      recorrido_repo_m.createQueryBuilder().getMany.mockResolvedValueOnce([
        {
          id: 50,
          solicitud_id: 1,
          fecha: '2026-10-05',
          tramo: Tramo.IDA,
          origen: 'Villa Adela',
          destino: 'Sede Central',
          tipo_actividad: 'practicas',
          tarifa: 100,
          solicitud: { periodo: 'Octubre 2026' },
        },
      ]);

      const todas = await servicio_con_multas.obtenerTodas();
      expect((todas[0] as any).multas_asistencia_bs).toBe(0);
      expect((todas[0] as any).monto_liquido_pagable).toBe(80);

      const una = await servicio_con_multas.obtenerPorId(1);
      expect((una as any).multas_asistencia_bs).toBe(0);
      expect((una as any).monto_liquido_pagable).toBe(80);

      const historial = await servicio_con_multas.obtenerHistorialParadasEstudiante({
        id_estudiante: 10,
      });
      expect(historial.resumen.devolucion_80_bs).toBe(80);
      expect(historial.resumen.multas_asistencia_bs).toBe(0);
      expect(historial.resumen.monto_liquido_pagable).toBe(80);
    });

    it('restringe los resultados al propio becario cuando el rol es BECARIO y a los designados cuando es SUPERVISOR', async () => {
      becario_repo_m.findOne.mockResolvedValue({ id: 10, usuario_id: 500 });
      becario_repo_m.find.mockResolvedValue([{ id: 10, supervisor_id: 77 }]);
      solicitud_repo_m.find.mockResolvedValue([
        {
          id: 1,
          becario_id: 10,
          estado: EstadoSolicitud.APROBADO,
          monto_total: 100,
          monto_devolucion: 80,
          becario: { id: 10, usuario_id: 500, supervisor_id: 77, usuario: { nombre: 'Becario Propio' } },
          recorridos: [],
        },
        {
          id: 2,
          becario_id: 20,
          estado: EstadoSolicitud.APROBADO,
          monto_total: 100,
          monto_devolucion: 80,
          becario: { id: 20, usuario_id: 600, supervisor_id: 88, usuario: { nombre: 'Becario Ajeno' } },
          recorridos: [],
        },
      ]);
      multa_repo_m.find.mockResolvedValue([]);

      const resultado_becario = await servicio_con_multas.calcularPagoPasajesConMultas({
        becario_id: 20,
        usuario_autenticado: { id: 500, rol: Rol.BECARIO } as Usuario,
      });
      expect(resultado_becario.becarios).toHaveLength(1);
      expect(resultado_becario.becarios[0].becario_id).toBe(10);

      const resultado_mentor = await servicio_con_multas.calcularPagoPasajesConMultas({
        usuario_autenticado: { id: 77, rol: Rol.SUPERVISOR } as Usuario,
      });
      expect(resultado_mentor.becarios).toHaveLength(1);
      expect(resultado_mentor.becarios[0].becario_id).toBe(10);
    });
  });
});

