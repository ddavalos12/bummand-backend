import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PasajesServicio } from './pasajes.servicio';
import { SolicitudPasajes, EstadoSolicitud } from './entidades/solicitud-pasaje.entidad';
import { Recorrido, Tramo } from './entidades/recorrido.entidad';

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

  describe('Catálogo geodésico de paradas frecuentes', () => {
    it('debe retornar paradas oficiales de transporte urbano', async () => {
      const paradas = await servicio.obtenerParadas();
      expect(paradas.length).toBeGreaterThan(0);
      expect(paradas.some((p) => p.nombre?.includes('Ceja'))).toBe(true);
    });

    it('debe permitir filtrar paradas por ciudad', async () => {
      const paradas_el_alto = await servicio.obtenerParadas('El Alto');
      expect(paradas_el_alto.every((p) => p.ciudad === 'El Alto')).toBe(true);

      const paradas_la_paz = await servicio.obtenerParadas('La Paz');
      expect(paradas_la_paz.every((p) => p.ciudad === 'La Paz')).toBe(true);
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
  });
});

