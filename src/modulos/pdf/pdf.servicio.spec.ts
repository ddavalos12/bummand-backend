import {
  PdfServicio,
  separarNombresYApellidos,
  CATALOGO_FIRMANTES_INSTITUCIONALES,
} from './pdf.servicio';
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
  });
});
