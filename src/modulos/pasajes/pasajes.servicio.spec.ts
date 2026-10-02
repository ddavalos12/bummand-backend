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

    recorrido_repo = {
      create: jest.fn().mockImplementation((datos) => ({ ...datos, id: 10 })),
      save: jest.fn().mockImplementation((datos) => Promise.resolve({ ...datos })),
      find: jest.fn(),
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
});
