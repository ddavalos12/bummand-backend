import {
  PdfServicio,
  separarNombresYApellidos,
  CATALOGO_FIRMANTES_INSTITUCIONALES,
} from './pdf.servicio';
import { NavegadorPdfServicio } from './navegador-pdf.servicio';
import { EstadoSolicitud } from '../pasajes/entidades/solicitud-pasaje.entidad';

describe('PdfServicio - Planillas Oficiales de Donación (Refrigerio y Transporte)', () => {
  let servicio: PdfServicio;

  const crearConstructorConsultaMock = <T>(datos: T[]) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(datos),
  });

  beforeEach(() => {
    servicio = new PdfServicio();
  });

  describe('separarNombresYApellidos y ordenamiento alfabético por apellido', () => {
    it('separa correctamente nombres de 4 y 3 palabras y aplica fallback seguro para menos de 3 palabras', () => {
      expect(separarNombresYApellidos('Nilda Amalia Churata Paye')).toEqual({
        nombres: 'Nilda Amalia',
        apellidos: 'Churata Paye',
      });

      expect(servicio.separarNombresYApellidos('Joel Mamani Quispe')).toEqual({
        nombres: 'Joel',
        apellidos: 'Mamani Quispe',
      });

      expect(servicio.separarNombresYApellidos('Ana Condori')).toEqual({
        nombres: 'Ana',
        apellidos: 'Condori',
      });

      expect(servicio.separarNombresYApellidos('Samuel')).toEqual({
        nombres: 'Samuel',
        apellidos: '',
      });

      expect(servicio.separarNombresYApellidos('   ')).toEqual({
        nombres: '',
        apellidos: '',
      });
    });

    it('ordena alfabéticamente por APELLIDOS y usa NOMBRES como criterio de desempate', () => {
      const desordenados = [
        servicio.separarNombresYApellidos('Joel Alex Quisbert Alanoca'),
        servicio.separarNombresYApellidos('Maria Belen Condori Quispe'),
        servicio.separarNombresYApellidos('Juan Carlos Aruquipa Mamani'),
        servicio.separarNombresYApellidos('Ana Lucia Condori Quispe'),
      ];

      const ordenados = servicio.ordenarBecariosPorApellido(desordenados);

      expect(ordenados.map((b) => `${b.apellidos}, ${b.nombres}`)).toEqual([
        'Aruquipa Mamani, Juan Carlos',
        'Condori Quispe, Ana Lucia',
        'Condori Quispe, Maria Belen',
        'Quisbert Alanoca, Joel Alex',
      ]);
    });
  });

  describe('Donación para refrigerio BUMAN-D', () => {
    it('consolida por responsable único receptor del reembolso, formatea montos en bolivianos y usa firmantes por defecto (Pamela + Samuel) sin columna FIRMA', () => {
      const html = servicio.generarDonacionRefrigerioHtml({
        mes: '2026-12',
        con_firma: 'false',
        refrigerios: [
          {
            becario_receptor_devolucion_nombre: 'Nilda Amalia Churata Paye',
            becario_encargado_1_nombre: 'Nilda Amalia Churata Paye',
            becario_encargado_2_nombre: 'Joel Mamani Quispe',
            monto_devolucion_bs: 94,
            costo_total_bs: 94,
            estado_reposicion: 'aprobado_administracion',
          },
          {
            becario_receptor_devolucion_nombre: 'Nilda Amalia Churata Paye',
            monto_devolucion_bs: 50,
            costo_total_bs: 50,
            estado_reposicion: 'aprobado_administracion',
          },
          {
            becario_receptor_devolucion_nombre: null,
            becario_encargado_1_nombre: 'Maria Belen Condori Quispe',
            monto_devolucion_bs: 0,
            costo_total_bs: 94,
            estado_reposicion: 'revisado_supervisor',
          },
          {
            becario_receptor_devolucion_nombre: 'Becario Rechazado Prueba',
            monto_devolucion_bs: 115,
            costo_total_bs: 115,
            estado_reposicion: 'rechazado',
          },
        ],
      });

      expect(html).toContain('Donación para refrigerio BUMAN-D');
      expect(html).toContain('Reuniones Escuela de Líderes');
      expect(html).toContain('Diciembre');
      expect(html).toContain('Nilda Amalia Churata Paye');
      expect(html).toContain('Maria Belen Condori Quispe');
      expect(html).not.toContain('Becario Rechazado Prueba');
      expect(html).toContain('144,00');
      expect(html).toContain('94,00');
      expect(html).toContain('TOTAL GASTO POR REFRIGERIO');
      expect(html).toContain('238,00');
      expect(html).not.toContain('<th class="col-firma">FIRMA</th>');
      expect(html).toContain(
        'El presente detalle consolida los gastos de refrigerio de las reuniones BUMAN-D.',
      );
      expect(html).toContain(CATALOGO_FIRMANTES_INSTITUCIONALES.pamela.nombre);
      expect(html).toContain(CATALOGO_FIRMANTES_INSTITUCIONALES.pamela.cargo);
      expect(html).toContain(CATALOGO_FIRMANTES_INSTITUCIONALES.samuel.nombre);
      expect(html).toContain(CATALOGO_FIRMANTES_INSTITUCIONALES.samuel.cargo);
    });

    it('incluye la columna FIRMA cuando con_firma=true, permite elegir Ruth/Pamela/Samuel y genera tabla válida con total 0,00 si no hay registros', () => {
      const html = servicio.generarDonacionRefrigerioHtml({
        fecha_inicio: '2026-11-01',
        fecha_fin: '2026-11-30',
        con_firma: 'true',
        firmante_1: 'ruth',
        firmante_2: 'pamela',
        refrigerios: [],
      });

      expect(html).toContain('Noviembre');
      expect(html).toContain('<th class="col-firma">FIRMA</th>');
      expect(html).toContain('TOTAL GASTO POR REFRIGERIO');
      expect(html).toContain('0,00');
      expect(html).toContain(CATALOGO_FIRMANTES_INSTITUCIONALES.ruth.nombre);
      expect(html).toContain(CATALOGO_FIRMANTES_INSTITUCIONALES.ruth.cargo);
      expect(html).toContain(CATALOGO_FIRMANTES_INSTITUCIONALES.pamela.nombre);
      expect(html).toContain(CATALOGO_FIRMANTES_INSTITUCIONALES.pamela.cargo);
    });

    it('genera el PDF y asigna el nombre de archivo oficial ConFirma o SinFirma', async () => {
      const qb_mock = crearConstructorConsultaMock([
        {
          id: 1,
          becario_receptor_devolucion_nombre: 'Nilda Amalia Churata Paye',
          monto_devolucion_bs: 94,
          costo_total_bs: 94,
          estado_reposicion: 'aprobado_administracion',
        },
      ]);
      const servicio_con_repos = new PdfServicio(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { createQueryBuilder: jest.fn().mockReturnValue(qb_mock) } as never,
      );

      jest
        .spyOn(servicio_con_repos, 'generarPdf')
        .mockResolvedValue(Buffer.from('PDF_REFRIGERIO'));

      const resultado = await servicio_con_repos.generarDonacionRefrigerioPdf({
        mes: '2026-12',
        con_firma: 'true',
        firmante_1: 'ruth',
        firmante_2: 'samuel',
      });

      expect(resultado.nombre_archivo).toBe(
        'Donacion_Refrigerio_BUMAND_Diciembre_ConFirma.pdf',
      );
      expect(resultado.bufer.toString()).toBe('PDF_REFRIGERIO');
    });
  });

  describe('Donación para transporte BUMAN-D', () => {
    it('incluye a TODOS los becarios (incluso con 0,00), ordena por apellido, calcula el 80% neto SIN descontar multas y alterna la columna FIRMA', () => {
      const becarios_mock = [
        { id: 1, nombre: 'Joel Alex Quisbert Alanoca' },
        { id: 2, nombre: 'Juan Carlos Aruquipa Mamani' },
        { id: 3, nombre: 'Maria Belen Condori Quispe' },
      ];

      const recorridos_mock = [
        {
          id: 10,
          tarifa: 1000,
          solicitud: {
            becario_id: 2,
            estado: EstadoSolicitud.APROBADO,
          },
        },
        {
          id: 11,
          tarifa: 556.25,
          solicitud: {
            becario_id: 3,
            estado: EstadoSolicitud.APROBADO_ADMINISTRACION,
          },
        },
        {
          id: 12,
          tarifa: 500,
          solicitud: {
            becario_id: 1,
            estado: EstadoSolicitud.BORRADOR,
          },
        },
        {
          id: 13,
          tarifa: 300,
          solicitud: {
            becario_id: 1,
            estado: EstadoSolicitud.RECHAZADO,
          },
        },
      ];

      const html_sin_firma = servicio.generarDonacionTransporteHtml({
        mes: '2026-11',
        con_firma: 'false',
        firmante_1: 'ruth',
        firmante_2: 'samuel',
        becarios: becarios_mock as never,
        recorridos: recorridos_mock as never,
      });

      expect(html_sin_firma).toContain('Donación para transporte BUMAN-D');
      expect(html_sin_firma).toContain('Noviembre');
      expect(html_sin_firma).not.toContain('<th class="col-firma">FIRMA</th>');

      const pos_aruquipa = html_sin_firma.indexOf('Aruquipa Mamani');
      const pos_condori = html_sin_firma.indexOf('Condori Quispe');
      const pos_quisbert = html_sin_firma.indexOf('Quisbert Alanoca');
      expect(pos_aruquipa).toBeGreaterThan(-1);
      expect(pos_condori).toBeGreaterThan(pos_aruquipa);
      expect(pos_quisbert).toBeGreaterThan(pos_condori);

      expect(html_sin_firma).toContain('800,00');
      expect(html_sin_firma).toContain('445,00');
      expect(html_sin_firma).toContain('0,00');
      expect(html_sin_firma).toContain('Total General Bs.');
      expect(html_sin_firma).toContain('1.245,00');
      expect(html_sin_firma).toContain(
        'El presente detalle consolida los gastos de transporte de los BUMAN-D para el cumplimiento de sus Prácticas Pre Profesionales.',
      );
      expect(html_sin_firma).toContain(
        CATALOGO_FIRMANTES_INSTITUCIONALES.ruth.nombre,
      );
      expect(html_sin_firma).toContain(
        CATALOGO_FIRMANTES_INSTITUCIONALES.samuel.nombre,
      );

      const html_con_firma = servicio.generarDonacionTransporteHtml({
        mes: '2026-11',
        con_firma: 'true',
        firmante_1: 'pamela',
        firmante_2: 'samuel',
        becarios: becarios_mock as never,
        recorridos: recorridos_mock as never,
      });

      expect(html_con_firma).toContain('<th class="col-firma">FIRMA</th>');
      expect(html_con_firma).toContain(
        CATALOGO_FIRMANTES_INSTITUCIONALES.pamela.nombre,
      );
      expect(html_con_firma).toContain(
        CATALOGO_FIRMANTES_INSTITUCIONALES.samuel.nombre,
      );
    });

    it('consulta todos los becarios en generarDonacionTransportePdf sin restar multas de asistencia', async () => {
      const becario_repo_mock = {
        find: jest.fn().mockResolvedValue([
          { id: 1, nombre: 'Nilda Amalia Churata Paye', usuario: null },
          {
            id: 2,
            nombre: null,
            usuario: { nombre: 'Joel Mamani Quispe' },
          },
        ]),
      };
      const qb_recorridos = crearConstructorConsultaMock([
        {
          id: 1,
          tarifa: 100,
          solicitud: { becario_id: 1, estado: EstadoSolicitud.APROBADO },
        },
      ]);
      const multa_repo_mock = {
        find: jest.fn().mockResolvedValue([{ id: 1, monto_bs: 50 }]),
      };

      const servicio_transporte = new PdfServicio(
        undefined,
        undefined,
        undefined,
        becario_repo_mock as never,
        undefined,
        {
          createQueryBuilder: jest.fn().mockReturnValue(qb_recorridos),
        } as never,
        undefined,
        undefined,
        multa_repo_mock as never,
      );

      const espia_pdf = jest
        .spyOn(servicio_transporte, 'generarPdf')
        .mockResolvedValue(Buffer.from('PDF_TRANSPORTE'));

      const resultado = await servicio_transporte.generarDonacionTransportePdf({
        fecha_inicio: '2026-12-01',
        fecha_fin: '2026-12-31',
        con_firma: 'false',
      });

      expect(becario_repo_mock.find).toHaveBeenCalledWith({
        relations: { usuario: true },
      });
      expect(multa_repo_mock.find).not.toHaveBeenCalled();
      expect(espia_pdf).toHaveBeenCalledTimes(1);
      const html_generado = espia_pdf.mock.calls[0][0];
      expect(html_generado).toContain('80,00');
      expect(html_generado).toContain('0,00');
      expect(resultado.nombre_archivo).toBe(
        'Donacion_Transporte_BUMAND_Diciembre_SinFirma.pdf',
      );
      expect(resultado.bufer.toString()).toBe('PDF_TRANSPORTE');
    });

    it('excluye recorridos de Escuela de Líderes en generarDonacionTransporteHtml y generarDonacionTransportePdf', async () => {
      const becarios_mock = [
        { id: 1, nombre: 'Juan Carlos Aruquipa Mamani' },
        { id: 2, nombre: 'Maria Belen Condori Quispe' },
      ];
      const recorridos_mixtos = [
        {
          id: 1,
          tarifa: 100,
          tipo_actividad: 'practicas',
          solicitud: { becario_id: 1, estado: EstadoSolicitud.APROBADO },
        },
        {
          id: 2,
          tarifa: 200,
          tipo_actividad: 'escuela_lideres',
          solicitud: { becario_id: 1, estado: EstadoSolicitud.APROBADO },
        },
        {
          id: 3,
          tarifa: 150,
          tipo_actividad: 'Escuela de Líderes',
          solicitud: { becario_id: 2, estado: EstadoSolicitud.APROBADO },
        },
        {
          id: 4,
          tarifa: 50,
          tipo_actividad: 'acciones_servicio',
          solicitud: { becario_id: 2, estado: EstadoSolicitud.APROBADO },
        },
      ];

      const html = servicio.generarDonacionTransporteHtml({
        mes: '2026-11',
        con_firma: 'false',
        becarios: becarios_mock as never,
        recorridos: recorridos_mixtos as never,
      });

      expect(html).toContain('80,00');
      expect(html).toContain('40,00');
      expect(html).toContain('120,00');
      expect(html).not.toContain('240,00');

      const qb_recorridos = crearConstructorConsultaMock(recorridos_mixtos);
      const servicio_pdf = new PdfServicio(
        undefined,
        undefined,
        undefined,
        { find: jest.fn().mockResolvedValue(becarios_mock) } as never,
        undefined,
        { createQueryBuilder: jest.fn().mockReturnValue(qb_recorridos) } as never,
      );
      const espia_pdf = jest
        .spyOn(servicio_pdf, 'generarPdf')
        .mockResolvedValue(Buffer.from('PDF_OK'));

      await servicio_pdf.generarDonacionTransportePdf({
        fecha_inicio: '2026-11-01',
        fecha_fin: '2026-11-30',
      });

      const html_pdf = espia_pdf.mock.calls[0][0];
      expect(html_pdf).toContain('120,00');
      expect(html_pdf).not.toContain('240,00');
    });
  });

  describe('Informe general de pasajes (generarPasajesGeneralPdf)', () => {
    it('excluye Escuela de Líderes y usa tabla liviana sin badges en rangos cortos (<= 400 tramos)', async () => {
      const recorridos_cortos = [
        {
          id: 1,
          fecha: new Date('2026-10-05T10:00:00Z'),
          tramo: 'ida',
          origen: 'Ceja El Alto',
          destino: 'San Francisco',
          calles_declaradas: 'Autopista LP-EA',
          medio_transporte: 'Minibús',
          tarifa: 10,
          tipo_actividad: 'practicas',
          solicitud: {
            becario_id: 1,
            estado: EstadoSolicitud.APROBADO,
            becario: { id: 1, ci: '9123841 LP', usuario: { nombre: 'Juan Carlos Aruquipa Mamani' } },
          },
        },
        {
          id: 2,
          fecha: new Date('2026-10-09T14:00:00Z'),
          tramo: 'ida',
          origen: 'Obelisco',
          destino: 'Auditorio Central',
          calles_declaradas: 'Av. Arce',
          medio_transporte: 'Mi Teleférico',
          tarifa: 50,
          tipo_actividad: 'Escuela de Líderes',
          solicitud: {
            becario_id: 1,
            estado: EstadoSolicitud.APROBADO,
            becario: { id: 1, ci: '9123841 LP', usuario: { nombre: 'Juan Carlos Aruquipa Mamani' } },
          },
        },
      ];

      const qb = crearConstructorConsultaMock(recorridos_cortos);
      const servicio_pdf = new PdfServicio(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { createQueryBuilder: jest.fn().mockReturnValue(qb) } as never,
      );
      const espia_pdf = jest
        .spyOn(servicio_pdf, 'generarPdf')
        .mockResolvedValue(Buffer.from('PDF_CORTO'));

      const res = await servicio_pdf.generarPasajesGeneralPdf({
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
      });

      expect(res.bufer.toString()).toBe('PDF_CORTO');
      const html = espia_pdf.mock.calls[0][0];
      expect(html).toContain('Bs 10.00');
      expect(html).toContain('Bs 8.00');
      expect(html).not.toContain('Auditorio Central');
      expect(html).not.toContain('class="badge');
      expect(html).not.toContain('Resumen consolidado por volumen del periodo');
    });

    it('consolida por becario y mes cuando existen más de 400 tramos excluyendo Escuela de Líderes', async () => {
      const recorridos_masivos = [];
      for (let i = 0; i < 260; i++) {
        recorridos_masivos.push({
          id: i + 1,
          fecha: new Date(i < 130 ? '2026-06-10T10:00:00Z' : '2026-07-10T10:00:00Z'),
          tramo: i % 2 === 0 ? 'ida' : 'vuelta',
          origen: 'Ceja El Alto',
          destino: 'Centro',
          tarifa: 2.5,
          tipo_actividad: 'practicas',
          solicitud: {
            becario_id: 1,
            estado: EstadoSolicitud.APROBADO,
            becario: { id: 1, ci: '111111 LP', usuario: { nombre: 'Ana Lucia Condori Quispe' } },
          },
        });
        recorridos_masivos.push({
          id: 1000 + i,
          fecha: new Date(i < 130 ? '2026-06-15T10:00:00Z' : '2026-07-15T10:00:00Z'),
          tramo: i % 2 === 0 ? 'ida' : 'vuelta',
          origen: 'Villa Adela',
          destino: 'Agencia Central',
          tarifa: 3.0,
          tipo_actividad: 'acciones_servicio',
          solicitud: {
            becario_id: 2,
            estado: EstadoSolicitud.APROBADO,
            becario: { id: 2, ci: '222222 LP', usuario: { nombre: 'Joel Alex Quisbert Alanoca' } },
          },
        });
      }
      recorridos_masivos.push({
        id: 9999,
        fecha: new Date('2026-06-20T14:00:00Z'),
        tramo: 'ida',
        origen: 'Obelisco',
        destino: 'Auditorio',
        tarifa: 100,
        tipo_actividad: 'escuela_lideres',
        solicitud: {
          becario_id: 1,
          estado: EstadoSolicitud.APROBADO,
          becario: { id: 1, ci: '111111 LP', usuario: { nombre: 'Ana Lucia Condori Quispe' } },
        },
      });

      const qb = crearConstructorConsultaMock(recorridos_masivos);
      const multa_repo_mock = {
        find: jest.fn().mockResolvedValue([
          { id: 1, becario_id: 1, monto_bs: 20, fecha_aplicacion: new Date('2026-06-12T10:00:00Z') },
        ]),
      };

      const servicio_pdf = new PdfServicio(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { createQueryBuilder: jest.fn().mockReturnValue(qb) } as never,
        undefined,
        undefined,
        multa_repo_mock as never,
      );
      const espia_pdf = jest
        .spyOn(servicio_pdf, 'generarPdf')
        .mockResolvedValue(Buffer.from('PDF_CONSOLIDADO'));

      const res = await servicio_pdf.generarPasajesGeneralPdf({
        fecha_inicio: '2026-06-01',
        fecha_fin: '2026-11-24',
      });

      expect(res.bufer.toString()).toBe('PDF_CONSOLIDADO');
      const html = espia_pdf.mock.calls[0][0];
      expect(html).toContain('Resumen consolidado por volumen del periodo — 520 tramos totales');
      expect(html).toContain('Junio 2026');
      expect(html).toContain('Julio 2026');
      expect(html).toContain('Bs 1430.00');
      expect(html).toContain('Bs 1144.00');
      expect(html).toContain('Bs 1124.00');
      const tbody_match = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
      expect(tbody_match).not.toBeNull();
      const filas_tbody = (tbody_match![1].match(/<tr>/g) || []).length;
      expect(filas_tbody).toBe(4);
    });
  });

  describe('Asistencia de Escuela de Líderes (enlazado con Multas y Permisos)', () => {
    it('incluye a TODOS los becarios, fija entrada 14:30 y enlaza permisos y multas de Escuela de Líderes', async () => {
      const becarios_mock = [
        { id: 1, ci: '13696496 LP', usuario: { nombre: 'Adai Belen Huayta Cardozo' } },
        { id: 2, ci: '9160054 LP', usuario: { nombre: 'Edgar Elias Alarcon Huanca' } },
        { id: 3, ci: '9107373 LP', usuario: { nombre: 'Daniel Davalos Quiñoñez' } },
      ];
      const registros_mock = [
        {
          id: 10,
          becario_id: 1,
          tipo: 'escuela_lideres',
          fecha: new Date('2026-10-09T00:00:00Z'),
          hora_prevista: '14:30',
          hora_ingreso: '14:48',
          minutos_retraso: 18,
          becario: becarios_mock[0],
        },
        {
          id: 11,
          becario_id: 2,
          tipo: 'escuela_lideres',
          fecha: new Date('2026-10-09T00:00:00Z'),
          hora_prevista: '14:30',
          hora_ingreso: '14:25',
          minutos_retraso: 0,
          becario: becarios_mock[1],
        },
      ];
      const justificaciones_mock = [
        {
          id: 20,
          becario_id: 3,
          tipo_incidencia: 'escuela_lideres',
          referencia_id: null,
          fecha_incidencia: new Date('2026-10-09T00:00:00Z'),
          motivo: 'Examen parcial universitario',
          estado: 'aprobada',
          becario: becarios_mock[2],
        },
      ];
      const multas_mock = [
        {
          id: 30,
          becario_id: 1,
          asistencia_id: 10,
          minutos_retraso: 18,
          monto_bs: 20,
          motivo: 'Retraso de 18 min en Escuela de Líderes (11 a 30 min)',
          fecha_aplicacion: new Date('2026-10-09T14:48:00Z'),
          becario: becarios_mock[0],
        },
      ];

      const servicio_pdf = new PdfServicio(
        undefined,
        undefined,
        { createQueryBuilder: jest.fn().mockReturnValue(crearConstructorConsultaMock(registros_mock)) } as never,
        { find: jest.fn().mockResolvedValue(becarios_mock) } as never,
        undefined,
        undefined,
        undefined,
        { createQueryBuilder: jest.fn().mockReturnValue(crearConstructorConsultaMock(justificaciones_mock)) } as never,
        { createQueryBuilder: jest.fn().mockReturnValue(crearConstructorConsultaMock(multas_mock)) } as never,
      );

      const espia_pdf = jest
        .spyOn(servicio_pdf, 'generarPdf')
        .mockResolvedValue(Buffer.from('PDF_LIDERES_OK'));

      const res = await servicio_pdf.generarAsistenciaEscuelaLideresPdf({
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
      });

      expect(res.bufer.toString()).toBe('PDF_LIDERES_OK');
      expect(res.nombre_archivo).toContain('Asistencia_Escuela_Lideres_Multas_Permisos');
      const html = espia_pdf.mock.calls[0][0];
      expect(html).toContain('14:30');
      expect(html).toContain('Alarcon Huanca, Edgar Elias');
      expect(html).toContain('Davalos Quiñoñez, Daniel');
      expect(html).toContain('Huayta Cardozo, Adai Belen');
      expect(html).toContain('Examen parcial universitario');
      expect(html).toContain('Bs 20,00');
    });
  });

  describe('Integración NavegadorPdfServicio y opción descontar_multas en PDFs de pasajes', () => {
    it('delega generarPdf y métodos landscape a NavegadorPdfServicio.generarPdfDesdeHtml', async () => {
      const navegador_mock = {
        generarPdfDesdeHtml: jest.fn().mockResolvedValue(Buffer.from('PDF_NAVEGADOR')),
      } as unknown as NavegadorPdfServicio;

      const servicio_pdf = new PdfServicio(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        navegador_mock,
      );

      const res_normal = await servicio_pdf.generarPdf('<html><body>Prueba</body></html>');
      expect(res_normal.toString()).toBe('PDF_NAVEGADOR');
      expect(navegador_mock.generarPdfDesdeHtml).toHaveBeenCalledWith(
        '<html><body>Prueba</body></html>',
        undefined,
      );

      const res_semestral = await servicio_pdf.generarReporteEvaluacionSemestralPdf();
      expect(res_semestral.toString()).toBe('PDF_NAVEGADOR');
      expect(navegador_mock.generarPdfDesdeHtml).toHaveBeenLastCalledWith(
        expect.any(String),
        {
          landscape: true,
          margin: { top: '8mm', right: '10mm', bottom: '8mm', left: '10mm' },
        },
      );
    });

    it('generarDonacionTransporteHtml y generarDonacionTransportePdf descuentan multas cuando descontar_multas=true y preservan BKL-23 cuando es false', async () => {
      const becarios_mock = [
        { id: 1, nombre: 'Juan Carlos Aruquipa Mamani' },
        { id: 2, nombre: 'Maria Belen Condori Quispe' },
      ];
      const recorridos_mock = [
        {
          id: 1,
          tarifa: 100,
          tipo_actividad: 'practicas',
          solicitud: { becario_id: 1, estado: EstadoSolicitud.APROBADO },
        },
        {
          id: 2,
          tarifa: 20,
          tipo_actividad: 'practicas',
          solicitud: { becario_id: 2, estado: EstadoSolicitud.APROBADO },
        },
      ];
      const multas_mock = [
        {
          id: 10,
          becario_id: 1,
          monto_bs: 20,
          fecha_aplicacion: new Date('2026-11-12T14:50:00Z'),
        },
        {
          id: 11,
          becario_id: 2,
          monto_bs: 30,
          fecha_aplicacion: new Date('2026-11-19T15:10:00Z'),
        },
      ];

      const html_con_descuento = servicio.generarDonacionTransporteHtml({
        mes: '2026-11',
        con_firma: 'false',
        descontar_multas: true,
        becarios: becarios_mock as never,
        recorridos: recorridos_mock as never,
        multas: multas_mock as never,
      });

      expect(html_con_descuento).toContain('80% Reconocido Bs.');
      expect(html_con_descuento).toContain('(-) Multas Bs.');
      expect(html_con_descuento).toContain('Líquido Pagable Bs.');
      expect(html_con_descuento).toContain('80,00');
      expect(html_con_descuento).toContain('20,00');
      expect(html_con_descuento).toContain('60,00');
      expect(html_con_descuento).toContain('16,00');
      expect(html_con_descuento).toContain('30,00');
      expect(html_con_descuento).toContain('0,00');
      expect(html_con_descuento).toContain('96,00');
      expect(html_con_descuento).toContain('50,00');
      expect(html_con_descuento).toContain('descuento reglamentario por multas de asistencia');

      const qb_recorridos = crearConstructorConsultaMock(recorridos_mock);
      const qb_multas = crearConstructorConsultaMock(multas_mock);
      const multa_repo_mock = {
        createQueryBuilder: jest.fn().mockReturnValue(qb_multas),
      };

      const servicio_pdf = new PdfServicio(
        undefined,
        undefined,
        undefined,
        { find: jest.fn().mockResolvedValue(becarios_mock) } as never,
        undefined,
        { createQueryBuilder: jest.fn().mockReturnValue(qb_recorridos) } as never,
        undefined,
        undefined,
        multa_repo_mock as never,
      );

      const espia_pdf = jest
        .spyOn(servicio_pdf, 'generarPdf')
        .mockResolvedValue(Buffer.from('PDF_TRANSPORTE_MULTAS'));

      const resultado_con = await servicio_pdf.generarDonacionTransportePdf({
        mes: '2026-11',
        con_firma: 'false',
        descontar_multas: 'true',
      });

      expect(multa_repo_mock.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(resultado_con.nombre_archivo).toBe(
        'Donacion_Transporte_BUMAND_Noviembre_SinFirma_ConDescuentoMultas.pdf',
      );
      expect(espia_pdf.mock.calls[0][0]).toContain('Líquido Pagable Bs.');

      multa_repo_mock.createQueryBuilder.mockClear();
      const resultado_sin = await servicio_pdf.generarDonacionTransportePdf({
        mes: '2026-11',
        con_firma: 'false',
        descontar_multas: 'false',
      });
      expect(multa_repo_mock.createQueryBuilder).not.toHaveBeenCalled();
      expect(resultado_sin.nombre_archivo).toBe(
        'Donacion_Transporte_BUMAND_Noviembre_SinFirma.pdf',
      );
      expect(espia_pdf.mock.calls[1][0]).toContain('Total Gral por c/u Bs.');
      expect(espia_pdf.mock.calls[1][0]).not.toContain('(-) Multas Bs.');
    });

    it('generarPasajesGeneralPdf y generarConsolidadoAuditoriaPdf excluyen descuento de multas cuando descontar_multas=false', async () => {
      const recorridos_mock = [
        {
          id: 1,
          fecha: new Date('2026-10-05T10:00:00Z'),
          tramo: 'ida',
          origen: 'Ceja',
          destino: 'Centro',
          tarifa: 100,
          tipo_actividad: 'practicas',
          solicitud: {
            becario_id: 1,
            estado: EstadoSolicitud.APROBADO,
            becario: { id: 1, ci: '111 LP', usuario: { nombre: 'Becario Uno' } },
          },
        },
      ];
      const solicitudes_mock = [
        { id: 1, becario_id: 1, monto_total: 100, monto_devolucion: 80 },
      ];
      const multas_mock = [
        { id: 1, becario_id: 1, monto_bs: 20, fecha_aplicacion: new Date('2026-10-10T10:00:00Z') },
      ];

      const servicio_pdf = new PdfServicio(
        undefined,
        undefined,
        undefined,
        undefined,
        { createQueryBuilder: jest.fn().mockReturnValue(crearConstructorConsultaMock(solicitudes_mock)) } as never,
        { createQueryBuilder: jest.fn().mockReturnValue(crearConstructorConsultaMock(recorridos_mock)) } as never,
        undefined,
        undefined,
        { find: jest.fn().mockResolvedValue(multas_mock) } as never,
      );

      const espia_pdf = jest
        .spyOn(servicio_pdf, 'generarPdf')
        .mockResolvedValue(Buffer.from('PDF_OK'));

      await servicio_pdf.generarPasajesGeneralPdf({
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
        descontar_multas: 'false',
      });
      const html_pasajes_sin = espia_pdf.mock.calls[0][0];
      expect(html_pasajes_sin).toContain('Excluye descuento de multas');
      expect(html_pasajes_sin).toContain('- Bs 0.00');
      expect(html_pasajes_sin).toContain('Bs 80.00');

      await servicio_pdf.generarConsolidadoAuditoriaPdf({
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
        descontar_multas: 'false',
      });
      const html_consolidado_sin = espia_pdf.mock.calls[1][0];
      expect(html_consolidado_sin).toContain('Excluye descuento de multas de asistencia');
      expect(html_consolidado_sin).toContain('- Bs 0.00');
      expect(html_consolidado_sin).toContain('Bs 80.00');
    });
  });
});
