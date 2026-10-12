import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AsistenciaServicio } from './asistencia.servicio';
import { RegistroAsistencia, TipoAsistencia } from './entidades/registro-asistencia.entidad';
import { Becario } from '../becarios/entidades/becario.entidad';
import { LugarPractica } from '../lugares-practica/entidades/lugar-practica.entidad';
import { Multa } from './entidades/multa.entidad';

describe('AsistenciaServicio', () => {
  let servicio: AsistenciaServicio;
  let asistencia_repo: any;
  let becario_repo: any;
  let lugar_repo: any;
  let multa_repo: any;
  let notificaciones_servicio: any;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 14, 10, 30, 0)); // Miércoles 10:30 AM

    asistencia_repo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 1 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d })),
      find: jest.fn(),
    };

    becario_repo = {
      findOne: jest.fn(),
    };

    lugar_repo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    multa_repo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => ({ ...d, id: 99 })),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d })),
      find: jest.fn(),
    };

    notificaciones_servicio = {
      crear: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        AsistenciaServicio,
        { provide: getRepositoryToken(RegistroAsistencia), useValue: asistencia_repo },
        { provide: getRepositoryToken(Becario), useValue: becario_repo },
        { provide: getRepositoryToken(LugarPractica), useValue: lugar_repo },
        { provide: getRepositoryToken(Multa), useValue: multa_repo },
        { provide: 'NotificacionesServicio', useValue: notificaciones_servicio },
      ],
    }).compile();

    servicio = modulo.get<AsistenciaServicio>(AsistenciaServicio);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Verificación de puntualidad según horario semanal y Escuela de Líderes', () => {
    it('debe registrar como puntual en Prácticas cuando marca dentro de su horario asignado', async () => {
      // Configuramos el horario del becario para que coincida con el día actual
      const ahora = new Date();
      const dias = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
      const dia_clave = dias[ahora.getDay()];

      // Simulamos que la hora límite es 2 horas en el futuro para que sea puntual
      const hora_futura = `${String((ahora.getHours() + 2) % 24).padStart(2, '0')}:00`;

      const becario_mock: Partial<Becario> = {
        id: 10,
        usuario_id: 10,
        horario_semanal: { [dia_clave]: `${hora_futura}-14:00` },
        lugar_practica: {
          id: 1,
          nombre: 'Agencia Central',
          latitud: -16.500000,
          longitud: -68.150000,
          radio_tolerancia_m: 500,
        } as LugarPractica,
      };

      becario_repo.findOne.mockResolvedValue(becario_mock);
      asistencia_repo.findOne.mockResolvedValue(null);

      const resultado = await servicio.registrarIngreso({
        becario_id: 10,
        tipo: TipoAsistencia.PRACTICAS,
        latitud: -16.500000,
        longitud: -68.150000,
      });

      expect(resultado.registro.dentro_de_horario).toBe(true);
      expect(resultado.registro.minutos_retraso).toBe(0);
      expect(resultado.registro.hora_prevista).toBe(hora_futura);
      expect(resultado.advertencia).toContain('✓ Ingreso puntual — dentro del horario');
    });

    it('debe registrar con retraso y calcular diff_minutos en Prácticas si marca posterior a la hora asignada', async () => {
      const ahora = new Date();
      const dias = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
      const dia_clave = dias[ahora.getDay()];

      // Simulamos que la hora prevista era hace 20 minutos
      const fecha_pasada = new Date(ahora.getTime() - 20 * 60000);
      const hora_pasada = `${String(fecha_pasada.getHours()).padStart(2, '0')}:${String(fecha_pasada.getMinutes()).padStart(2, '0')}`;

      const becario_mock: Partial<Becario> = {
        id: 11,
        usuario_id: 11,
        horario_semanal: { [dia_clave]: `${hora_pasada}-13:00` },
        lugar_practica: {
          id: 1,
          nombre: 'Agencia Central',
          latitud: -16.500000,
          longitud: -68.150000,
          radio_tolerancia_m: 500,
        } as LugarPractica,
      };

      becario_repo.findOne.mockResolvedValue(becario_mock);
      asistencia_repo.findOne.mockResolvedValue(null);

      const resultado = await servicio.registrarIngreso({
        becario_id: 11,
        tipo: TipoAsistencia.PRACTICAS,
        latitud: -16.500000,
        longitud: -68.150000,
      });

      expect(resultado.registro.dentro_de_horario).toBe(false);
      expect(resultado.registro.minutos_retraso).toBeGreaterThanOrEqual(19);
      expect(resultado.registro.hora_prevista).toBe(hora_pasada);
      expect(resultado.advertencia).toContain('⚠ Ingreso registrado con retraso');
      expect(resultado.advertencia).toContain(`hora prevista ${hora_pasada}`);
    });

    it('debe indicar sin horario asignado si el día actual no tiene apoyo programado en Prácticas', async () => {
      const becario_mock: Partial<Becario> = {
        id: 12,
        usuario_id: 12,
        horario_semanal: {}, // Vacío sin días asignados
        lugar_practica: {
          id: 1,
          nombre: 'Agencia Central',
          latitud: -16.500000,
          longitud: -68.150000,
          radio_tolerancia_m: 500,
        } as LugarPractica,
      };

      becario_repo.findOne.mockResolvedValue(becario_mock);
      asistencia_repo.findOne.mockResolvedValue(null);

      const resultado = await servicio.registrarIngreso({
        becario_id: 12,
        tipo: TipoAsistencia.PRACTICAS,
        latitud: -16.500000,
        longitud: -68.150000,
      });

      expect(resultado.registro.dentro_de_horario).toBe(true);
      expect(resultado.registro.minutos_retraso).toBe(0);
      expect(resultado.advertencia).toBe('Sin horario de apoyo asignado para hoy');
    });

    it('debe validar la hora límite 14:30 para Escuela de Líderes', async () => {
      const becario_mock: Partial<Becario> = {
        id: 13,
        usuario_id: 13,
        lugar_practica: {
          id: 1,
          nombre: 'Sede Pastoral',
          latitud: -16.500000,
          longitud: -68.150000,
          radio_tolerancia_m: 500,
        } as LugarPractica,
      };

      becario_repo.findOne.mockResolvedValue(becario_mock);
      asistencia_repo.findOne.mockResolvedValue(null);

      const resultado = await servicio.registrarIngreso({
        becario_id: 13,
        tipo: TipoAsistencia.ESCUELA_LIDERES,
        latitud: -16.500000,
        longitud: -68.150000,
      });

      expect(resultado.registro.hora_prevista).toBe('14:30');
      // La respuesta siempre contendrá el formato institucional según la hora actual
      if (resultado.registro.dentro_de_horario) {
        expect(resultado.advertencia).toBe('✓ Ingreso puntual — dentro del horario (14:30)');
      } else {
        expect(resultado.advertencia).toContain('⚠ Ingreso registrado con retraso');
        expect(resultado.advertencia).toContain('hora prevista 14:30');
      }
    });

    it('debe emitir multa institucional de Bs 10 por minuto cuando se marca en Escuela de Líderes pasada la tolerancia de 14:35', async () => {
      // Viernes 16 de Octubre de 2026 a las 14:40 (10 minutos pasadas las 14:30)
      jest.setSystemTime(new Date(2026, 9, 16, 14, 40, 0));

      const becario_mock: Partial<Becario> = {
        id: 14,
        usuario_id: 14,
        lugar_practica: {
          id: 1,
          nombre: 'Sede Pastoral',
          latitud: -16.500000,
          longitud: -68.150000,
          radio_tolerancia_m: 500,
        } as LugarPractica,
      };

      becario_repo.findOne.mockResolvedValue(becario_mock);
      asistencia_repo.findOne.mockResolvedValue(null);

      const resultado = await servicio.registrarIngreso({
        becario_id: 14,
        tipo: TipoAsistencia.ESCUELA_LIDERES,
        latitud: -16.500000,
        longitud: -68.150000,
      });

      expect(resultado.registro.dentro_de_horario).toBe(false);
      expect(resultado.registro.minutos_retraso).toBe(10);
      expect(multa_repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          becario_id: 14,
          minutos_retraso: 10,
          monto_bs: 100, // 10 min * Bs 10
          es_institucional: true,
        }),
      );
      expect(multa_repo.save).toHaveBeenCalled();
    });
  });

  describe('Confirmación de Asistencia por Organizador', () => {
    it('debe marcar confirmado_organizador en true al confirmar', async () => {
      const registro_mock: Partial<RegistroAsistencia> = {
        id: 5,
        becario_id: 10,
        confirmado_organizador: false,
      };

      asistencia_repo.findOne.mockResolvedValue(registro_mock);

      const resultado = await servicio.confirmarOrganizador({
        asistencia_id: 5,
        observaciones: 'Asistencia presencial verificada',
      });

      expect(resultado.confirmados).toBe(1);
      expect(registro_mock.confirmado_organizador).toBe(true);
      expect(asistencia_repo.save).toHaveBeenCalled();
    });
  });

  describe('Consultas de Multas', () => {
    it('debe listar multas filtrando por becario_id si se solicita', async () => {
      becario_repo.findOne.mockResolvedValue({ id: 10, usuario_id: 10 });
      multa_repo.find.mockResolvedValue([{ id: 1, monto_bs: 50, becario_id: 10 }]);

      const multas = await servicio.obtenerMisMultas(10);
      expect(multas).toHaveLength(1);
      expect(multa_repo.find).toHaveBeenCalledWith({
        where: { becario_id: 10 },
        order: { fecha_aplicacion: 'DESC' },
        relations: { asistencia: true },
      });
    });
  });
});
