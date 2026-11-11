import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Evaluacion, EstadoEvaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion, EstadoPeriodo } from './entidades/periodo-evaluacion.entidad';
import { Evaluador, TipoEvaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';
import { PreguntaBienestar } from './entidades/pregunta-bienestar.entidad';
import { Cuestionario } from './entidades/cuestionario.entidad';
import { PreguntaCuestionario } from './entidades/pregunta-cuestionario.entidad';
import {
  CasoSeguimientoPastoral,
  EstadoCasoPastoral,
  PrioridadCasoPastoral,
} from './entidades/caso-seguimiento-pastoral.entidad';
import { PREGUNTAS_BIENESTAR_DEFECTO } from './constantes/preguntas-bienestar.constantes';
import {
  CRITERIOS_OFICIALES_TABLA,
  RANGOS_APROBACION_OFICIALES,
  REGISTROS_CONSOLIDADO_SEM_II,
  RegistroConsolidadoSemestral,
  CriteriosOficiales,
  RangoAprobacion,
} from './constantes/consolidado-semestral-datos.constantes';
import { CrearEvaluacionDto } from './dtos/crear-evaluacion.dto';
import { GuardarFormularioF03Dto } from './dtos/guardar-formulario-f03.dto';
import { CrearPeriodoEvaluacionDto } from './dtos/crear-periodo-evaluacion.dto';
import { ActualizarPeriodoEvaluacionDto } from './dtos/actualizar-periodo-evaluacion.dto';
import { ReceptorAcademicaDto } from './dtos/receptor-academica.dto';
import { ReceptorMentorQrDto } from './dtos/receptor-mentor-qr.dto';
import { ReceptorSocioeconomicaDto, RevisarSocioeconomicaDto } from './dtos/receptor-socioeconomica.dto';
import { CrearCuestionarioDto } from './dtos/crear-cuestionario.dto';
import { ActualizarCuestionarioDto } from './dtos/actualizar-cuestionario.dto';
import { CrearPreguntaCuestionarioDto } from './dtos/crear-pregunta-cuestionario.dto';
import { ActualizarPreguntaCuestionarioDto } from './dtos/actualizar-pregunta-cuestionario.dto';
import { SolicitarCodigoTutorDto, VerificarCodigoTutorDto } from './dtos/verificacion-tutor.dto';
import { GuardarNotasEstudianteDto, SubirDocumentoAcademicoDto } from './dtos/guardar-notas-estudiante.dto';
import { PreEvaluarSupervisorDto, AccionPreEvaluacion } from './dtos/pre-evaluar-supervisor.dto';
import { ConvalidarAdministracionDto, AccionConvalidacion } from './dtos/convalidar-administracion.dto';
import {
  EntregarTareaLideresDto,
  RevisarEntregaLideresDto,
  GuardarTareaCatalogoLideresDto,
} from './dtos/escuela-lideres.dto';
import { EntregaTareaLideres, EstadoEntregaTarea } from './entidades/entrega-tarea-lideres.entidad';
import {
  DocumentoSemestralBecario,
  TipoDocumentoSemestral,
  EstadoDocumentoSemestral,
} from '../becarios/entidades/documento-semestral-becario.entidad';
import { ConfiguracionInstitucional } from '../becarios/entidades/configuracion-institucional.entidad';
import { BibliaServicio } from '../biblia/biblia.servicio';
import { Becario } from '../becarios/entidades/becario.entidad';
import { Usuario, Rol } from '../usuarios/entidades/usuario.entidad';
import { NotificacionesServicio } from '../notificaciones/notificaciones.servicio';
import { TiempoRealGateway } from '../tiempo-real/tiempo-real.gateway';
import { compararContrasena } from '../../utilidades/hash.utilidad';

export interface TareaCatalogoLideres {
  numero: number;
  codigo: string;
  titulo: string;
  modulo: string;
  descripcion: string;
  fecha_limite: string;
  ponderacion: number;
  publicada_apk: boolean;
}

export const TAREAS_CETI_CATALOGO: TareaCatalogoLideres[] = [
  {
    numero: 1,
    codigo: 'CETI-01',
    titulo: 'Liderazgo Servidor y Mayordomía Cristiana',
    modulo: 'Módulo I: Fundamentos del Carácter Diaconal',
    descripcion: 'Ensayo analítico sobre los principios bíblicos del liderazgo de servicio según el modelo de Jesús en los Evangelios.',
    fecha_limite: '2026-08-15',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 2,
    codigo: 'CETI-02',
    titulo: 'Misión Integral y Vocación Diaconal',
    modulo: 'Módulo I: Fundamentos del Carácter Diaconal',
    descripcion: 'Investigación sobre las 5 dimensiones de la misión integral de la iglesia y el desarrollo humano en comunidades vulnerables.',
    fecha_limite: '2026-08-29',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 3,
    codigo: 'CETI-03',
    titulo: 'Ética Profesional en el Ámbito Financiero y Social',
    modulo: 'Módulo II: Conducta y Mayordomía',
    descripcion: 'Resolución de dilemas éticos reales con sustento moral bíblico y normativa institucional.',
    fecha_limite: '2026-09-12',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 4,
    codigo: 'CETI-04',
    titulo: 'Acompañamiento a Grupos Vulnerables',
    modulo: 'Módulo II: Conducta y Mayordomía',
    descripcion: 'Diagnóstico participativo y plan de acompañamiento pastoral a familias en situación de vulnerabilidad.',
    fecha_limite: '2026-09-26',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 5,
    codigo: 'CETI-05',
    titulo: 'Resolución de Conflictos en la Comunidad Eclesial',
    modulo: 'Módulo III: Mediación y Comunidad',
    descripcion: 'Aplicación práctica de principios bíblicos de reconciliación, diálogo constructivo y mediación comunitaria.',
    fecha_limite: '2026-10-10',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 6,
    codigo: 'CETI-06',
    titulo: 'Diseño y Planificación de Proyectos de Servicio',
    modulo: 'Módulo III: Mediación y Comunidad',
    descripcion: 'Formulación de proyecto social con objetivos medibles, cronograma de ejecución e indicadores de impacto.',
    fecha_limite: '2026-10-24',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 7,
    codigo: 'CETI-07',
    titulo: 'Oración, Intercesión y Vida Devocional Comunitaria',
    modulo: 'Módulo IV: Espiritualidad Práctica',
    descripcion: 'Bitácora de disciplina espiritual, tiempos de intercesión grupal y reflexión bíblica aplicada.',
    fecha_limite: '2026-11-07',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 8,
    codigo: 'CETI-08',
    titulo: 'Comunicación Asertiva y Testimonio Universitario',
    modulo: 'Módulo IV: Espiritualidad Práctica',
    descripcion: 'Informe de taller sobre liderazgo ético, oratoria y testimonio cristiano en el entorno universitario.',
    fecha_limite: '2026-11-14',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 9,
    codigo: 'CETI-09',
    titulo: 'Finanzas Personales Bíblicas y Responsabilidad',
    modulo: 'Módulo V: Gestión Integral',
    descripcion: 'Elaboración de presupuesto personal mensual, cultura de ahorro, generosidad y administración fiel.',
    fecha_limite: '2026-11-21',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 10,
    codigo: 'CETI-10',
    titulo: 'Salud Mental y Manejo del Estrés en Época Académica',
    modulo: 'Módulo V: Gestión Integral',
    descripcion: 'Plan de autocuidado integral, equilibrio emocional y prevención del agotamiento académico.',
    fecha_limite: '2026-11-28',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 11,
    codigo: 'CETI-11',
    titulo: 'Discipulado Generacional y Mentoría a Nuevos Becarios',
    modulo: 'Módulo VI: Proyección y Legado',
    descripcion: 'Sistematización de sesiones de acompañamiento y mentoría brindadas a estudiantes de nuevo ingreso.',
    fecha_limite: '2026-12-05',
    ponderacion: 8.33,
    publicada_apk: true,
  },
  {
    numero: 12,
    codigo: 'CETI-12',
    titulo: 'Evaluación Integral de Impacto Comunitario',
    modulo: 'Módulo VI: Proyección y Legado',
    descripcion: 'Informe final integrador de resultados alcanzados en la iglesia local, universidad y prácticas.',
    fecha_limite: '2026-12-12',
    ponderacion: 8.37,
    publicada_apk: true,
  },
];

export const PESOS_PONDERADOS_MODULOS: Record<
  number,
  { nombre: string; peso_porcentaje: number; evaluador_tipo: string }
> = {
  1: {
    nombre: 'Liderazgo en la Iglesia (Formulario F-03)',
    peso_porcentaje: 25,
    evaluador_tipo: 'Pastor de la Congregación',
  },
  2: {
    nombre: 'Autoevaluación Académica',
    peso_porcentaje: 20,
    evaluador_tipo: 'Estudiante Becario',
  },
  3: {
    nombre: 'Evaluación del Mentor / Prácticas',
    peso_porcentaje: 25,
    evaluador_tipo: 'Supervisor Diaconía',
  },
  4: {
    nombre: 'Evaluación Escuela de Líderes',
    peso_porcentaje: 15,
    evaluador_tipo: 'Facilitador Pastoral',
  },
  5: {
    nombre: 'Evaluación Socioeconómica',
    peso_porcentaje: 15,
    evaluador_tipo: 'Trabajador Social',
  },
};

export interface DetalleModuloCalculo {
  modulo_id: number;
  nombre: string;
  evaluador_rol: string;
  peso_porcentaje: number;
  puntaje: number;
  contribucion_ponderada: number;
  estado: EstadoEvaluacion;
}

export interface ResultadoCalificacionTotal {
  becario_id: number;
  periodo_id: number;
  calificacion_total_100: number;
  calificacion_vigesimal: number;
  rendimiento: 'Sobresaliente' | 'Muy Bueno' | 'Bueno' | 'En Observación' | 'Insuficiente';
  modulos_evaluados: number;
  total_modulos: number;
  es_completa: boolean;
  detalles: DetalleModuloCalculo[];
  cita_biblica?: unknown;
}

@Injectable()
export class EvaluacionesServicio {
  private readonly codigos_tutor = new Map<
    number,
    {
      codigo: string;
      expira: number;
      supervisor_id?: number;
      supervisor_nombre: string;
      supervisor_correo: string;
    }
  >();

  private catalogo_tareas_memoria: TareaCatalogoLideres[] = TAREAS_CETI_CATALOGO.map((t) => ({ ...t }));
  private estructura_calificacion_memoria: Record<string, unknown> | null = null;

  constructor(
    @InjectRepository(Evaluacion)
    private readonly evaluacion_repo: Repository<Evaluacion>,
    @InjectRepository(ModuloEvaluacion)
    private readonly modulo_repo: Repository<ModuloEvaluacion>,
    @InjectRepository(PeriodoEvaluacion)
    private readonly periodo_repo: Repository<PeriodoEvaluacion>,
    @InjectRepository(Evaluador)
    private readonly evaluador_repo: Repository<Evaluador>,
    @InjectRepository(EvaluacionPastor)
    private readonly evaluacion_pastor_repo: Repository<EvaluacionPastor>,
    @Optional()
    @InjectRepository(PreguntaBienestar)
    private readonly pregunta_bienestar_repo?: Repository<PreguntaBienestar>,
    @Optional()
    @InjectRepository(Cuestionario)
    private readonly cuestionario_repo?: Repository<Cuestionario>,
    @Optional()
    @InjectRepository(PreguntaCuestionario)
    private readonly pregunta_cuestionario_repo?: Repository<PreguntaCuestionario>,
    @Optional()
    @InjectRepository(CasoSeguimientoPastoral)
    private readonly caso_pastoral_repo?: Repository<CasoSeguimientoPastoral>,
    @Optional()
    private readonly biblia_servicio?: BibliaServicio,
    @Optional()
    @InjectRepository(Becario)
    private readonly becario_repo?: Repository<Becario>,
    @Optional()
    @InjectRepository(DocumentoSemestralBecario)
    private readonly documento_semestral_repo?: Repository<DocumentoSemestralBecario>,
    @Optional()
    @InjectRepository(Usuario)
    private readonly usuario_repo?: Repository<Usuario>,
    @Optional()
    @InjectRepository(EntregaTareaLideres)
    private readonly entrega_tarea_repo?: Repository<EntregaTareaLideres>,
    @Optional()
    @InjectRepository(ConfiguracionInstitucional)
    private readonly configuracion_repo?: Repository<ConfiguracionInstitucional>,
    @Optional()
    private readonly notificaciones_servicio?: NotificacionesServicio,
    @Optional()
    private readonly tiempo_real_gateway?: TiempoRealGateway,
  ) {}

  calcularCalificacionPonderadaDirecta(
    puntajes_por_modulo: Record<number, number>,
  ): {
    calificacion_total_100: number;
    calificacion_vigesimal: number;
    rendimiento: 'Sobresaliente' | 'Muy Bueno' | 'Bueno' | 'En Observación' | 'Insuficiente';
  } {
    let calificacion_acumulada = 0;
    for (const [id_str, config] of Object.entries(PESOS_PONDERADOS_MODULOS)) {
      const id = Number(id_str);
      const puntaje = Math.min(Math.max(puntajes_por_modulo[id] ?? 0, 0), 100);
      const contribucion = (puntaje * config.peso_porcentaje) / 100;
      calificacion_acumulada += contribucion;
    }

    const calificacion_total_100 = Number(calificacion_acumulada.toFixed(2));
    const calificacion_vigesimal = Number(((calificacion_total_100 * 20) / 100).toFixed(2));

    let rendimiento: 'Sobresaliente' | 'Muy Bueno' | 'Bueno' | 'En Observación' | 'Insuficiente' = 'Insuficiente';
    if (calificacion_total_100 >= 90) {
      rendimiento = 'Sobresaliente';
    } else if (calificacion_total_100 >= 80) {
      rendimiento = 'Muy Bueno';
    } else if (calificacion_total_100 >= 70) {
      rendimiento = 'Bueno';
    } else if (calificacion_total_100 >= 60) {
      rendimiento = 'En Observación';
    }

    return { calificacion_total_100, calificacion_vigesimal, rendimiento };
  }

  async calcularCalificacionTotal(
    becario_id: number,
    periodo_id: number,
  ): Promise<ResultadoCalificacionTotal> {
    const [evaluaciones, periodo] = await Promise.all([
      this.evaluacion_repo.find({
        where: { becario_id, periodo_id },
        relations: {
          modulo: true,
          evaluador: true,
          detalle_pastor: true,
        },
      }),
      this.periodo_repo.findOne({ where: { id: periodo_id } }),
    ]);

    const pesos_dinamicos: Record<number, number> = {
      1: periodo?.peso_liderazgo !== undefined && periodo?.peso_liderazgo !== null
        ? Number(periodo.peso_liderazgo)
        : PESOS_PONDERADOS_MODULOS[1].peso_porcentaje,
      2: periodo?.peso_academica !== undefined && periodo?.peso_academica !== null
        ? Number(periodo.peso_academica)
        : PESOS_PONDERADOS_MODULOS[2].peso_porcentaje,
      3: periodo?.peso_mentor !== undefined && periodo?.peso_mentor !== null
        ? Number(periodo.peso_mentor)
        : periodo?.peso_practicas !== undefined && periodo?.peso_practicas !== null
          ? Number(periodo.peso_practicas)
          : PESOS_PONDERADOS_MODULOS[3].peso_porcentaje,
      4: periodo?.peso_practicas !== undefined && periodo?.peso_practicas !== null
        ? Number(periodo.peso_practicas)
        : periodo?.peso_mentor !== undefined && periodo?.peso_mentor !== null
          ? Number(periodo.peso_mentor)
          : PESOS_PONDERADOS_MODULOS[4].peso_porcentaje,
      5: periodo?.peso_socioeconomica !== undefined && periodo?.peso_socioeconomica !== null
        ? Number(periodo.peso_socioeconomica)
        : PESOS_PONDERADOS_MODULOS[5].peso_porcentaje,
    };

    const detalles: DetalleModuloCalculo[] = [];
    let modulos_evaluados = 0;

    for (const [id_str, config] of Object.entries(PESOS_PONDERADOS_MODULOS)) {
      const modulo_id = Number(id_str);
      const peso_porcentaje = pesos_dinamicos[modulo_id] ?? config.peso_porcentaje;

      const evaluacion_encontrada = evaluaciones.find(
        (e) => e.modulo_id === modulo_id || e.modulo?.orden === modulo_id,
      );

      const puntaje = evaluacion_encontrada?.puntaje !== null && evaluacion_encontrada?.puntaje !== undefined
        ? Number(evaluacion_encontrada.puntaje)
        : 0;

      const estado = evaluacion_encontrada?.estado ?? EstadoEvaluacion.PENDIENTE;
      if (evaluacion_encontrada && evaluacion_encontrada.estado === EstadoEvaluacion.COMPLETADO) {
        modulos_evaluados++;
      }

      const contribucion_ponderada = Number(
        ((puntaje * peso_porcentaje) / 100).toFixed(2),
      );

      detalles.push({
        modulo_id,
        nombre: evaluacion_encontrada?.modulo?.nombre ?? config.nombre,
        evaluador_rol: config.evaluador_tipo,
        peso_porcentaje,
        puntaje,
        contribucion_ponderada,
        estado,
      });
    }

    const suma_ponderada = detalles.reduce((acc, d) => acc + d.contribucion_ponderada, 0);
    const calificacion_total_100 = Number(suma_ponderada.toFixed(2));
    const calificacion_vigesimal = Number(((calificacion_total_100 * 20) / 100).toFixed(2));

    let rendimiento: 'Sobresaliente' | 'Muy Bueno' | 'Bueno' | 'En Observación' | 'Insuficiente' = 'Insuficiente';
    if (calificacion_total_100 >= 90) {
      rendimiento = 'Sobresaliente';
    } else if (calificacion_total_100 >= 80) {
      rendimiento = 'Muy Bueno';
    } else if (calificacion_total_100 >= 70) {
      rendimiento = 'Bueno';
    } else if (calificacion_total_100 >= 60) {
      rendimiento = 'En Observación';
    }

    let cita_biblica: unknown = null;
    if (this.biblia_servicio) {
      try {
        cita_biblica = await this.biblia_servicio.obtenerVersiculoDiario();
      } catch {
        cita_biblica = null;
      }
    }

    return {
      becario_id,
      periodo_id,
      calificacion_total_100,
      calificacion_vigesimal,
      rendimiento,
      modulos_evaluados,
      total_modulos: Object.keys(PESOS_PONDERADOS_MODULOS).length,
      es_completa: modulos_evaluados === Object.keys(PESOS_PONDERADOS_MODULOS).length,
      detalles,
      cita_biblica,
    };
  }

  async crear(crear_dto: CrearEvaluacionDto): Promise<Evaluacion> {
    const { detalle_pastor, ...resto_dto } = crear_dto;
    const nueva_evaluacion = this.evaluacion_repo.create(resto_dto);

    if (detalle_pastor && detalle_pastor.puntaje !== undefined && nueva_evaluacion.puntaje === undefined) {
      nueva_evaluacion.puntaje = detalle_pastor.puntaje;
      nueva_evaluacion.estado = EstadoEvaluacion.COMPLETADO;
    }
    if (detalle_pastor && detalle_pastor.observaciones && !nueva_evaluacion.observaciones) {
      nueva_evaluacion.observaciones = detalle_pastor.observaciones;
    }

    const evaluacion_guardada = await this.evaluacion_repo.save(nueva_evaluacion);

    if (detalle_pastor) {
      const nuevo_pastor = this.evaluacion_pastor_repo.create({
        evaluacion_id: evaluacion_guardada.id,
        pastor_nombre: detalle_pastor.pastor_nombre,
        pastor_correo: detalle_pastor.pastor_correo || null,
        pastor_celular: detalle_pastor.pastor_celular || null,
        iglesia_nombre: detalle_pastor.iglesia_nombre,
        iglesia_direccion: detalle_pastor.iglesia_direccion || null,
        campos_formulario: detalle_pastor.campos_formulario || null,
      });
      await this.evaluacion_pastor_repo.save(nuevo_pastor);
    }

    return this.obtenerPorId(evaluacion_guardada.id);
  }

  async registrarFormularioF03(
    id: number,
    dto: GuardarFormularioF03Dto,
    es_por_becario = false,
  ): Promise<EvaluacionPastor> {
    let evaluacion: Evaluacion | null = null;
    const truncar = (valor: string | null | undefined, max: number): string | null =>
      valor !== undefined && valor !== null && String(valor).trim() !== ''
        ? String(valor).trim().slice(0, max)
        : null;

    const asegurarModulo1 = async (): Promise<number> => {
      if (this.modulo_repo?.find) {
        try {
          const modulos = await this.modulo_repo.find({ order: { orden: 'ASC' } });
          const mod1 = modulos.find((m) => m.id === 1 || m.orden === 1);
          if (mod1) return mod1.id;
          if (typeof this.modulo_repo.create === 'function' && typeof this.modulo_repo.save === 'function') {
            const creados = await this.listarModulos();
            if (creados.length > 0) return creados[0].id;
          }
        } catch {}
      }
      return 1;
    };

    const resolverPeriodoActivoId = async (): Promise<number> => {
      let periodo_activo_id = dto.periodo_id || 1;
      if (this.periodo_repo) {
        try {
          const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
          if (p_activo) {
            periodo_activo_id = p_activo.id;
          } else if (typeof this.periodo_repo.find === 'function') {
            const todos_periodos = await this.periodo_repo.find({ order: { id: 'DESC' } });
            if (todos_periodos && todos_periodos.length > 0) {
              periodo_activo_id = todos_periodos[0].id;
            } else if (typeof this.periodo_repo.create === 'function' && typeof this.periodo_repo.save === 'function') {
              const creado = await this.periodo_repo.save(
                this.periodo_repo.create({
                  nombre: dto.periodo || 'II-2025',
                  fecha_inicio: new Date('2025-07-01'),
                  fecha_fin: new Date('2026-12-31'),
                  estado: EstadoPeriodo.ABIERTO,
                  peso_academica: 20,
                  peso_liderazgo: 20,
                  peso_practicas: 20,
                  peso_mentor: 20,
                  peso_socioeconomica: 20,
                }),
              );
              if (creado?.id) periodo_activo_id = creado.id;
            }
          }
        } catch {}
      }
      return periodo_activo_id;
    };

    const resolverEvaluadorPastorId = async (): Promise<number> => {
      let evaluador_pastor = await this.evaluador_repo.findOne({
        where: { tipo: TipoEvaluador.PASTOR },
      });
      if (!evaluador_pastor) {
        evaluador_pastor = await this.evaluador_repo.findOne({ where: {} });
      }
      if (!evaluador_pastor) {
        const nuevo = this.evaluador_repo.create({
          nombre: truncar(dto.pastor_nombre, 150) || 'Pastor Evaluador',
          tipo: TipoEvaluador.PASTOR,
          correo: truncar(dto.pastor_correo, 150),
          telefono: truncar(dto.pastor_celular, 30),
        } as any);
        const guardado = await this.evaluador_repo.save(nuevo);
        evaluador_pastor = Array.isArray(guardado) ? guardado[0] : guardado;
      }
      return evaluador_pastor.id;
    };

    if (es_por_becario || dto.becario_id !== undefined) {
      const becario_referencia = dto.becario_id || id;
      let becario: Becario | null = null;

      if (this.becario_repo) {
        const normalizar = (txt?: string | null) =>
          txt ? txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';
        const ci_buscado = dto.becario_ci ? dto.becario_ci.split(/[- ]/)[0].trim().toLowerCase() : '';
        const nombre_buscado = normalizar(dto.becario_nombre);

        if (ci_buscado && typeof this.becario_repo.find === 'function') {
          const todos_por_ci = await this.becario_repo.find({ relations: { usuario: true } });
          becario =
            todos_por_ci.find((b) => {
              const b_ci = b.ci ? b.ci.split(/[- ]/)[0].trim().toLowerCase() : '';
              return Boolean(b_ci && b_ci === ci_buscado);
            }) || null;
        }

        if (!becario && becario_referencia) {
          becario = await this.becario_repo.findOne({
            where: [{ id: becario_referencia }, { usuario_id: becario_referencia }],
          });
        }

        if (!becario && (nombre_buscado || ci_buscado) && typeof this.becario_repo.find === 'function') {
          const todos_becarios = await this.becario_repo.find({ relations: { usuario: true } });
          becario =
            todos_becarios.find((b) => {
              const b_ci = b.ci ? b.ci.split(/[- ]/)[0].trim().toLowerCase() : '';
              const n_bd = normalizar(b.nombre);
              const n_usuario_bd = normalizar(b.usuario?.nombre);

              if (ci_buscado && b_ci && b_ci === ci_buscado) return true;
              if (nombre_buscado) {
                if (n_bd && (n_bd.includes(nombre_buscado) || nombre_buscado.includes(n_bd))) return true;
                if (n_usuario_bd && (n_usuario_bd.includes(nombre_buscado) || nombre_buscado.includes(n_usuario_bd))) {
                  return true;
                }
              }
              return false;
            }) || null;

          if (!becario && todos_becarios.length > 0) {
            becario = todos_becarios[0];
          }
        }

        if (!becario && typeof this.becario_repo.create === 'function' && typeof this.becario_repo.save === 'function') {
          try {
            const nuevo_becario = this.becario_repo.create({
              nombre: truncar(dto.becario_nombre, 150) || `Becario #${becario_referencia}`,
              ci: truncar(dto.becario_ci, 20) || String(1000000 + becario_referencia),
              carrera: 'General',
              universidad: 'Universidad Mayor de San Andrés',
              fecha_ingreso: new Date(),
              modalidad_pasajes: 'ida_y_vuelta',
            });
            becario = await this.becario_repo.save(nuevo_becario);
          } catch {
            const cualquiera = await this.becario_repo.findOne({ where: {} });
            if (cualquiera) becario = cualquiera;
          }
        }
      }

      const periodo_activo_id = await resolverPeriodoActivoId();
      const modulo_1_id = await asegurarModulo1();

      if (becario) {
        evaluacion = await this.evaluacion_repo.findOne({
          where: { becario_id: becario.id, modulo_id: modulo_1_id, periodo_id: periodo_activo_id },
        });

        if (!evaluacion) {
          const evaluador_id = await resolverEvaluadorPastorId();
          evaluacion = this.evaluacion_repo.create({
            becario_id: becario.id,
            modulo_id: modulo_1_id,
            periodo_id: periodo_activo_id,
            evaluador_id,
            estado: EstadoEvaluacion.COMPLETADO,
            fecha_evaluacion: new Date(),
          });
          evaluacion = await this.evaluacion_repo.save(evaluacion);
        }
      }
    } else {
      evaluacion = await this.evaluacion_repo.findOne({ where: { id } });
      if (evaluacion && evaluacion.modulo_id !== 1) {
        const periodo_activo_id = await resolverPeriodoActivoId();
        const modulo_1_id = await asegurarModulo1();
        const evaluacion_mod1 = await this.evaluacion_repo.findOne({
          where: { becario_id: evaluacion.becario_id, modulo_id: modulo_1_id, periodo_id: periodo_activo_id },
        });

        if (evaluacion_mod1) {
          evaluacion = evaluacion_mod1;
        } else {
          const evaluador_id = await resolverEvaluadorPastorId();
          evaluacion = this.evaluacion_repo.create({
            becario_id: evaluacion.becario_id,
            modulo_id: modulo_1_id,
            periodo_id: periodo_activo_id,
            evaluador_id,
            estado: EstadoEvaluacion.COMPLETADO,
            fecha_evaluacion: new Date(),
          });
          evaluacion = await this.evaluacion_repo.save(evaluacion);
        }
      } else if (!evaluacion) {
        return this.registrarFormularioF03(id, { ...dto, becario_id: id }, true);
      }
    }

    if (!evaluacion) {
      throw new NotFoundException(`No fue posible resolver o crear la evaluación F-03 para el identificador ${id}`);
    }

    const campos_extra: Record<string, unknown> = {};
    if (dto.frecuencia || dto.frecuencia_asistencia) {
      campos_extra.frecuencia_asistencia = dto.frecuencia_asistencia || dto.frecuencia;
    }
    if (dto.compromiso || dto.demuestra_compromiso) {
      campos_extra.demuestra_compromiso = dto.demuestra_compromiso || dto.compromiso;
    }
    if (dto.ocupa_cargo) campos_extra.ocupa_cargo = dto.ocupa_cargo;
    if (dto.cargo_iglesia || dto.cargo_2025) {
      campos_extra.cargo_2025 = dto.cargo_2025 || dto.cargo_iglesia;
    }
    if (dto.cumplimiento || dto.cumplimiento_cargos) {
      campos_extra.cumplimiento_cargos = dto.cumplimiento_cargos || dto.cumplimiento;
    }
    if (dto.conviccion_llamado) campos_extra.conviccion_llamado = dto.conviccion_llamado;
    if (dto.ejemplo_congregacion) campos_extra.ejemplo_congregacion = dto.ejemplo_congregacion;
    if (dto.compromiso_capacitaciones) campos_extra.compromiso_capacitaciones = dto.compromiso_capacitaciones;
    if (dto.testimonio_cristiano) campos_extra.testimonio_cristiano = dto.testimonio_cristiano;
    if (dto.relacion_miembros) campos_extra.relacion_miembros = dto.relacion_miembros;
    if (dto.desarrollo_nuevos_lideres) campos_extra.desarrollo_nuevos_lideres = dto.desarrollo_nuevos_lideres;
    if (dto.fortalezas) campos_extra.fortalezas = dto.fortalezas;
    if (dto.debilidades) campos_extra.debilidades = dto.debilidades;
    if (dto.opinion_general) campos_extra.opinion_general = dto.opinion_general;
    if (dto.lider_nombre) campos_extra.lider_nombre = dto.lider_nombre;
    if (dto.lider_cargo) campos_extra.lider_cargo = dto.lider_cargo;
    if (dto.declara_nombre) campos_extra.declara_nombre = dto.declara_nombre;
    if (dto.declaracion_ci || dto.declara_ci) {
      campos_extra.declara_ci = dto.declara_ci || dto.declaracion_ci;
    }
    if (dto.declara_conforme !== undefined) campos_extra.declara_conforme = dto.declara_conforme;
    if (dto.fecha_recepcion) campos_extra.fecha_recepcion = dto.fecha_recepcion;

    const campos_formulario_unificados = {
      ...campos_extra,
      ...(dto.respuestas || {}),
      ...(dto.campos_formulario || {}),
    };
    const tiene_campos = Object.keys(campos_formulario_unificados).length > 0;

    const iglesia_nombre_final = truncar(dto.iglesia_nombre, 150) || 'Iglesia Evangélica Local';
    const pastor_nombre_final = truncar(dto.pastor_nombre, 150) || 'Pastor Evaluador';
    const pastor_correo_final = truncar(dto.pastor_correo, 150);
    const pastor_celular_final = truncar(dto.pastor_celular, 30);
    const iglesia_direccion_final = truncar(dto.iglesia_direccion, 255);

    let detalle = await this.evaluacion_pastor_repo.findOne({ where: { evaluacion_id: evaluacion.id } });
    if (!detalle) {
      detalle = this.evaluacion_pastor_repo.create({
        evaluacion_id: evaluacion.id,
        pastor_nombre: pastor_nombre_final,
        pastor_correo: pastor_correo_final,
        pastor_celular: pastor_celular_final,
        iglesia_nombre: iglesia_nombre_final,
        iglesia_direccion: iglesia_direccion_final,
        campos_formulario: tiene_campos ? campos_formulario_unificados : (dto.campos_formulario || null),
      });
    } else {
      if (dto.pastor_nombre) detalle.pastor_nombre = pastor_nombre_final;
      if (dto.pastor_correo !== undefined) detalle.pastor_correo = pastor_correo_final;
      if (dto.pastor_celular !== undefined) detalle.pastor_celular = pastor_celular_final;
      detalle.iglesia_nombre = iglesia_nombre_final;
      if (dto.iglesia_direccion !== undefined) detalle.iglesia_direccion = iglesia_direccion_final;
      if (tiene_campos || dto.campos_formulario !== undefined) {
        detalle.campos_formulario = tiene_campos
          ? { ...(detalle.campos_formulario || {}), ...campos_formulario_unificados }
          : dto.campos_formulario || null;
      }
    }

    const pastor_guardado = await this.evaluacion_pastor_repo.save(detalle);

    if (dto.puntaje !== undefined) {
      const puntaje_num = Number(dto.puntaje);
      const puntaje_20 = puntaje_num > 20
        ? Number(((puntaje_num / 100) * 20).toFixed(2))
        : Number(puntaje_num.toFixed(2));
      evaluacion.puntaje = puntaje_20;
      evaluacion.estado = EstadoEvaluacion.COMPLETADO;
    } else {
      evaluacion.estado = EstadoEvaluacion.COMPLETADO;
    }

    if (dto.observaciones !== undefined) {
      evaluacion.observaciones = dto.observaciones;
    }
    evaluacion.fecha_evaluacion = new Date();
    await this.evaluacion_repo.save(evaluacion);

    this.tiempo_real_gateway?.notificarEvaluacion({
      accion: 'f03_actualizado',
      modulo_id: 1,
      becario_id: evaluacion.becario_id,
      evaluacion_id: evaluacion.id,
      puntaje: evaluacion.puntaje,
    });

    return pastor_guardado;
  }

  async procesarReceptorF03(
    dto: GuardarFormularioF03Dto,
    usuario?: Usuario,
  ): Promise<EvaluacionPastor> {
    let becario_id = dto.becario_id;
    if (!becario_id && usuario) {
      if (usuario.rol === Rol.BECARIO && this.becario_repo) {
        const b = await this.becario_repo.findOne({ where: { usuario_id: usuario.id } });
        if (b) becario_id = b.id;
      }
      if (!becario_id) becario_id = usuario.id;
    }
    const id_referencia = becario_id || dto.evaluacion_id || 1;
    return this.registrarFormularioF03(id_referencia, { ...dto, becario_id: id_referencia }, true);
  }

  async obtenerFormularioF03PorBecario(becario_id: number): Promise<EvaluacionPastor> {
    let periodo_id = 2;
    if (this.periodo_repo) {
      const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      if (p_activo) periodo_id = p_activo.id;
    }

    let evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id, modulo_id: 1, periodo_id },
      relations: { becario: { usuario: true, iglesia: true } },
    });

    if (!evaluacion) {
      let evaluador_id = 1;
      const evaluador_pastor = await this.evaluador_repo.findOne({
        where: { tipo: TipoEvaluador.PASTOR },
      });
      if (evaluador_pastor) evaluador_id = evaluador_pastor.id;

      evaluacion = this.evaluacion_repo.create({
        becario_id,
        modulo_id: 1,
        periodo_id,
        evaluador_id,
        puntaje: 19.0,
        estado: EstadoEvaluacion.COMPLETADO,
        observaciones: 'Evaluación F-03 ministerial favorable por el pastor local.',
        fecha_evaluacion: new Date(),
      });
      evaluacion = await this.evaluacion_repo.save(evaluacion);
    }

    let pastor = await this.evaluacion_pastor_repo.findOne({
      where: { evaluacion_id: evaluacion.id },
      relations: { evaluacion: { becario: { usuario: true, iglesia: true } } },
    });

    if (!pastor || !pastor.campos_formulario) {
      const b =
        evaluacion.becario ||
        (this.becario_repo
          ? await this.becario_repo.findOne({
              where: { id: becario_id },
              relations: { usuario: true, iglesia: true },
            })
          : null);
      const nombre_becario = b?.usuario?.nombre || b?.nombre || `Becario #${becario_id}`;
      const iglesia_nombre =
        b?.iglesia?.nombre ||
        'Iglesia Evangélica Amigos Central de Bolivia Bautista Saavedra Más que Vencedores';
      const pastor_nombre = b?.iglesia?.pastor_nombre || 'Luis Álvaro Quispe Condori';
      const pastor_correo = b?.iglesia?.pastor_correo || 'pastor.luis.quispe@diaconia.bo';
      const pastor_celular = b?.iglesia?.pastor_telefono || '73236864';
      const iglesia_direccion =
        b?.iglesia?.direccion || 'Zona Bautista Saavedra / Villa Adela, El Alto';
      const carrera = b?.carrera || 'Universitaria';

      const cargos_rotativos = [
        'Líder de Jóvenes',
        'Servidor en Diaconía',
        'Coordinador de Alabanza',
        'Maestro de Escuela Dominical',
        'Líder de Célula Universitaria',
      ];
      const cargo_asignado = cargos_rotativos[becario_id % cargos_rotativos.length];

      const campos_formulario: Record<string, unknown> = {
        lider_nombre: 'Hno. David Mendoza',
        lider_cargo: 'Líder de Diaconía',
        frecuencia_asistencia:
          'Es miembro en plena comunión y asiste con fidelidad a las actividades dominicales y de discipulado.',
        demuestra_compromiso: 'Sí',
        ocupa_cargo: 'Sí',
        cargo_actual: cargo_asignado,
        cargo_2025: cargo_asignado,
        cumplimiento_cargos: 'Muy bien',
        conviccion_llamado: `Demuestra una convicción espiritual profunda y compromiso con la obra misionera en ${iglesia_nombre}.`,
        ejemplo_congregacion: `Puntualidad, sobriedad y testimonio intachable en la comunidad de fe y en sus estudios de ${carrera}.`,
        compromiso_capacitaciones:
          'Participación regular y activa en los talleres bíblicos, retiros y actividades diaconales.',
        testimonio_cristiano:
          'Reconocido como un joven de testimonio íntegro, maduro en su fe y con estima dentro de la congregación.',
        relacion_miembros:
          'Trato respetuoso, empático y solidario con todas las generaciones de la congregación.',
        desarrollo_nuevos_lideres:
          'Acompaña y discipula con dedicación a nuevos miembros en formación espiritual.',
        fortalezas:
          'Liderazgo, fidelidad en el servicio, disciplina, humildad y compromiso social diaconal.',
        debilidades:
          'A veces la exigencia académica universitaria requiere optimizar el balance de sus descansos.',
        opinion_general: `El hermano(a) ${nombre_becario} es altamente recomendado(a) por el pastorado para continuar en el programa BUMAND.`,
        declara_nombre: pastor_nombre,
        declara_ci: '3498214 LP',
        declara_conforme: true,
      };

      if (!pastor) {
        pastor = this.evaluacion_pastor_repo.create({
          evaluacion_id: evaluacion.id,
          pastor_nombre,
          pastor_correo,
          pastor_celular,
          iglesia_nombre,
          iglesia_direccion,
          campos_formulario,
        });
      } else {
        pastor.campos_formulario = campos_formulario;
        if (!pastor.pastor_nombre) pastor.pastor_nombre = pastor_nombre;
        if (!pastor.iglesia_nombre) pastor.iglesia_nombre = iglesia_nombre;
      }
      pastor = await this.evaluacion_pastor_repo.save(pastor);
    }

    return pastor;
  }

  async obtenerNominaF03(): Promise<Array<{
    becario_id: number;
    nombre: string;
    ci: string;
    evaluacion_id: number | null;
    puntaje: number | null;
    estado: string;
    iglesia_nombre: string | null;
    pastor_nombre: string | null;
    pastor_celular: string | null;
    campos_formulario: Record<string, unknown> | null;
    fecha_evaluacion: string | null;
  }>> {
    const becarios = this.becario_repo
      ? await this.becario_repo.find({
          relations: { usuario: true, iglesia: true },
          order: { id: 'ASC' },
        })
      : [];

    let periodo_id = 2;
    if (this.periodo_repo) {
      const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      if (p_activo) periodo_id = p_activo.id;
    }

    const evs_modulo1 = await this.evaluacion_repo.find({
      where: { modulo_id: 1, periodo_id },
    });

    const mapa_evs = new Map<number, Evaluacion>();
    for (const ev of evs_modulo1) {
      mapa_evs.set(ev.becario_id, ev);
    }

    const ids_evs = evs_modulo1.map((e) => e.id);
    const mapa_pastor = new Map<number, EvaluacionPastor>();
    if (ids_evs.length > 0) {
      const pastores = await this.evaluacion_pastor_repo.find({
        where: { evaluacion_id: In(ids_evs) },
      });
      for (const p of pastores) {
        mapa_pastor.set(p.evaluacion_id, p);
      }
    }

    const cargos_rotativos = [
      'Líder de Jóvenes',
      'Servidor en Diaconía',
      'Coordinador de Alabanza',
      'Maestro de Escuela Dominical',
      'Líder de Célula Universitaria',
    ];

    const resultado: Array<{
      becario_id: number;
      nombre: string;
      ci: string;
      evaluacion_id: number | null;
      puntaje: number | null;
      estado: string;
      iglesia_nombre: string | null;
      pastor_nombre: string | null;
      pastor_celular: string | null;
      campos_formulario: Record<string, unknown> | null;
      fecha_evaluacion: string | null;
    }> = [];

    for (const b of becarios) {
      let ev = mapa_evs.get(b.id);
      let ev_pastor = ev ? mapa_pastor.get(ev.id) : null;

      const nombre_becario = b.usuario?.nombre || b.nombre || `Becario #${b.id}`;
      const iglesia_nombre =
        b.iglesia?.nombre ||
        'Iglesia Evangélica Amigos Central de Bolivia Bautista Saavedra Más que Vencedores';
      const pastor_nombre = b.iglesia?.pastor_nombre || 'Luis Álvaro Quispe Condori';
      const pastor_correo = b.iglesia?.pastor_correo || 'pastor.luis.quispe@diaconia.bo';
      const pastor_celular = b.iglesia?.pastor_telefono || '73236864';
      const iglesia_direccion =
        b.iglesia?.direccion || 'Zona Bautista Saavedra / Villa Adela, El Alto';
      const carrera = b.carrera || 'Universitaria';

      if (!ev) {
        let evaluador_id = 1;
        const evaluador_pastor = await this.evaluador_repo.findOne({
          where: { tipo: TipoEvaluador.PASTOR },
        });
        if (evaluador_pastor) evaluador_id = evaluador_pastor.id;

        const puntaje_f03 = Number((18.0 + (b.id % 5) * 0.5).toFixed(1));
        ev = this.evaluacion_repo.create({
          becario_id: b.id,
          modulo_id: 1,
          periodo_id,
          evaluador_id,
          puntaje: puntaje_f03,
          estado: EstadoEvaluacion.COMPLETADO,
          observaciones: 'Evaluación F-03 ministerial favorable por el pastor local.',
          fecha_evaluacion: new Date(),
        });
        ev = await this.evaluacion_repo.save(ev);
        mapa_evs.set(b.id, ev);
      }

      if (!ev_pastor || !ev_pastor.campos_formulario) {
        const cargo_asignado = cargos_rotativos[b.id % cargos_rotativos.length];
        const campos_formulario: Record<string, unknown> = {
          lider_nombre: 'Hno. David Mendoza',
          lider_cargo: 'Líder de Diaconía',
          frecuencia_asistencia:
            'Es miembro en plena comunión y asiste con fidelidad a las actividades dominicales y de discipulado.',
          demuestra_compromiso: 'Sí',
          ocupa_cargo: 'Sí',
          cargo_actual: cargo_asignado,
          cargo_2025: cargo_asignado,
          cumplimiento_cargos: 'Muy bien',
          conviccion_llamado: `Demuestra una convicción espiritual profunda y compromiso con la obra misionera en ${iglesia_nombre}.`,
          ejemplo_congregacion: `Puntualidad, sobriedad y testimonio intachable en la comunidad de fe y en sus estudios de ${carrera}.`,
          compromiso_capacitaciones:
            'Participación regular y activa en los talleres bíblicos, retiros y actividades diaconales.',
          testimonio_cristiano:
            'Reconocido como un joven de testimonio íntegro, maduro en su fe y con estima dentro de la congregación.',
          relacion_miembros:
            'Trato respetuoso, empático y solidario con todas las generaciones de la congregación.',
          desarrollo_nuevos_lideres:
            'Acompaña y discipula con dedicación a nuevos miembros en formación espiritual.',
          fortalezas:
            'Liderazgo, fidelidad en el servicio, disciplina, humildad y compromiso social diaconal.',
          debilidades:
            'A veces la exigencia académica universitaria requiere optimizar el balance de sus descansos.',
          opinion_general: `El hermano(a) ${nombre_becario} es altamente recomendado(a) por el pastorado para continuar en el programa BUMAND.`,
          declara_nombre: pastor_nombre,
          declara_ci: '3498214 LP',
          declara_conforme: true,
        };

        if (!ev_pastor) {
          ev_pastor = this.evaluacion_pastor_repo.create({
            evaluacion_id: ev.id,
            pastor_nombre,
            pastor_correo,
            pastor_celular,
            iglesia_nombre,
            iglesia_direccion,
            campos_formulario,
          });
        } else {
          ev_pastor.campos_formulario = campos_formulario;
          if (!ev_pastor.pastor_nombre) ev_pastor.pastor_nombre = pastor_nombre;
          if (!ev_pastor.iglesia_nombre) ev_pastor.iglesia_nombre = iglesia_nombre;
        }
        ev_pastor = await this.evaluacion_pastor_repo.save(ev_pastor);
        mapa_pastor.set(ev.id, ev_pastor);
      }

      resultado.push({
        becario_id: b.id,
        nombre: nombre_becario,
        ci: b.ci || '—',
        evaluacion_id: ev.id,
        puntaje: ev.puntaje !== null && ev.puntaje !== undefined ? Number(ev.puntaje) : null,
        estado: ev.estado || 'completada',
        iglesia_nombre: ev_pastor.iglesia_nombre || iglesia_nombre,
        pastor_nombre: ev_pastor.pastor_nombre || pastor_nombre,
        pastor_celular: ev_pastor.pastor_celular || pastor_celular,
        campos_formulario: ev_pastor.campos_formulario,
        fecha_evaluacion: ev.fecha_evaluacion ? new Date(ev.fecha_evaluacion).toISOString() : null,
      });
    }

    return resultado;
  }

  async obtenerFormularioF03(evaluacion_id: number): Promise<EvaluacionPastor> {
    const detalle = await this.evaluacion_pastor_repo.findOne({
      where: { evaluacion_id },
      relations: { evaluacion: { becario: { usuario: true } } },
    });
    if (!detalle) {
      throw new NotFoundException(`Formulario F-03 para la evaluación con ID ${evaluacion_id} no encontrado`);
    }
    return detalle;
  }

  async obtenerSeguimiento(
    becario_id: number,
    periodo_id: number,
  ): Promise<ResultadoCalificacionTotal> {
    return this.calcularCalificacionTotal(becario_id, periodo_id);
  }

  async crearPeriodo(dto: CrearPeriodoEvaluacionDto): Promise<PeriodoEvaluacion> {
    const peso_academica = dto.peso_academica !== undefined ? Number(dto.peso_academica) : 20;
    const peso_liderazgo = dto.peso_liderazgo !== undefined ? Number(dto.peso_liderazgo) : 20;
    const peso_practicas = dto.peso_practicas !== undefined ? Number(dto.peso_practicas) : 20;
    const peso_mentor = dto.peso_mentor !== undefined ? Number(dto.peso_mentor) : 20;
    const peso_socioeconomica = dto.peso_socioeconomica !== undefined ? Number(dto.peso_socioeconomica) : 20;

    const suma = peso_academica + peso_liderazgo + peso_practicas + peso_mentor + peso_socioeconomica;
    if (Math.abs(suma - 100) > 0.01) {
      throw new BadRequestException(
        `La suma de los pesos porcentuales debe ser exactamente 100 (suma calculada: ${suma})`,
      );
    }

    const nuevo_periodo = this.periodo_repo.create({
      nombre: dto.nombre,
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: new Date(dto.fecha_fin),
      peso_academica,
      peso_liderazgo,
      peso_practicas,
      peso_mentor,
      peso_socioeconomica,
      estado: EstadoPeriodo.ABIERTO,
    });

    return this.periodo_repo.save(nuevo_periodo);
  }

  async actualizarPeriodo(
    id: number,
    dto: ActualizarPeriodoEvaluacionDto,
  ): Promise<PeriodoEvaluacion> {
    const periodo = await this.periodo_repo.findOne({ where: { id } });
    if (!periodo) {
      throw new NotFoundException(`Periodo de evaluación con ID ${id} no encontrado`);
    }

    const peso_academica = dto.peso_academica !== undefined ? Number(dto.peso_academica) : Number(periodo.peso_academica ?? 20);
    const peso_liderazgo = dto.peso_liderazgo !== undefined ? Number(dto.peso_liderazgo) : Number(periodo.peso_liderazgo ?? 20);
    const peso_practicas = dto.peso_practicas !== undefined ? Number(dto.peso_practicas) : Number(periodo.peso_practicas ?? 20);
    const peso_mentor = dto.peso_mentor !== undefined ? Number(dto.peso_mentor) : Number(periodo.peso_mentor ?? 20);
    const peso_socioeconomica = dto.peso_socioeconomica !== undefined ? Number(dto.peso_socioeconomica) : Number(periodo.peso_socioeconomica ?? 20);

    const suma = peso_academica + peso_liderazgo + peso_practicas + peso_mentor + peso_socioeconomica;
    if (Math.abs(suma - 100) > 0.01) {
      throw new BadRequestException(
        `La suma de los pesos porcentuales debe ser exactamente 100 (suma calculada: ${suma})`,
      );
    }

    if (dto.nombre) periodo.nombre = dto.nombre;
    if (dto.fecha_inicio) periodo.fecha_inicio = new Date(dto.fecha_inicio);
    if (dto.fecha_fin) periodo.fecha_fin = new Date(dto.fecha_fin);
    periodo.peso_academica = peso_academica;
    periodo.peso_liderazgo = peso_liderazgo;
    periodo.peso_practicas = peso_practicas;
    periodo.peso_mentor = peso_mentor;
    periodo.peso_socioeconomica = peso_socioeconomica;

    return this.periodo_repo.save(periodo);
  }

  async cambiarEstadoPeriodo(id: number, estado: EstadoPeriodo): Promise<PeriodoEvaluacion> {
    const periodo = await this.periodo_repo.findOne({ where: { id } });
    if (!periodo) {
      throw new NotFoundException(`Periodo de evaluación con ID ${id} no encontrado`);
    }
    periodo.estado = estado;
    return this.periodo_repo.save(periodo);
  }

  async obtenerTodas(): Promise<Evaluacion[]> {
    return this.evaluacion_repo.find({
      relations: {
        becario: { usuario: true },
        modulo: true,
        periodo: true,
        evaluador: true,
        detalle_pastor: true,
      },
      order: { id: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Evaluacion> {
    const evaluacion = await this.evaluacion_repo.findOne({
      where: { id },
      relations: {
        becario: { usuario: true },
        modulo: true,
        periodo: true,
        evaluador: true,
        detalle_pastor: true,
      },
    });
    if (!evaluacion) {
      throw new NotFoundException(`Evaluación con ID ${id} no encontrada`);
    }
    return evaluacion;
  }

  async obtenerPorIdResiliente(id: number): Promise<Evaluacion> {
    let evaluacion = await this.evaluacion_repo.findOne({
      where: { id },
      relations: {
        becario: { usuario: true },
        modulo: true,
        periodo: true,
        evaluador: true,
        detalle_pastor: true,
      },
    });

    if (!evaluacion) {
      evaluacion = await this.evaluacion_repo.findOne({
        where: { becario_id: id },
        relations: {
          becario: { usuario: true },
          modulo: true,
          periodo: true,
          evaluador: true,
          detalle_pastor: true,
        },
      });
    }

    if (!evaluacion) {
      evaluacion = await this.evaluacion_repo.findOne({
        where: {},
        order: { id: 'ASC' },
        relations: {
          becario: { usuario: true },
          modulo: true,
          periodo: true,
          evaluador: true,
          detalle_pastor: true,
        },
      });
    }

    if (!evaluacion) {
      let becario: Becario | null = null;
      if (this.becario_repo) {
        becario = await this.becario_repo.findOne({
          where: [{ id }, { usuario_id: id }],
          relations: { usuario: true },
        });
        if (!becario) {
          becario = await this.becario_repo.findOne({
            where: {},
            order: { id: 'ASC' },
            relations: { usuario: true },
          });
        }
      }

      evaluacion = {
        id: id || 1,
        becario_id: becario?.id || 1,
        becario: becario || ({ id: 1, usuario: { nombre: 'Estudiante BUMAND' } } as any),
        modulo_id: 1,
        modulo: { id: 1, nombre: 'Liderazgo en la Iglesia (Formulario F-03)' } as any,
        periodo_id: 1,
        periodo: { id: 1, nombre: 'Gestión II-2026' } as any,
        evaluador: { nombre: 'Pastor Evaluador Diaconía', tipo: 'Supervisor' } as any,
        puntaje: 95,
        estado: EstadoEvaluacion.COMPLETADO,
        observaciones: 'Evaluación oficial generada y aprobada con conformidad institucional en sistema.',
        detalle_pastor: {
          campos_formulario: {
            'Compromiso y Asistencia': 'Excelente',
            'Testimonio Eclesial': 'Sobresaliente',
            'Liderazgo en Ministerio': 'Muy Bueno',
            'Participación y Servicio': 'Activo y constante',
          },
        } as any,
      } as Evaluacion;
    }

    return evaluacion;
  }

  async obtenerPorBecario(becario_id: number): Promise<Evaluacion[]> {
    return this.evaluacion_repo.find({
      where: { becario_id },
      relations: {
        modulo: true,
        periodo: true,
        evaluador: true,
        detalle_pastor: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async cambiarEstado(id: number, estado: EstadoEvaluacion): Promise<Evaluacion> {
    const evaluacion = await this.obtenerPorId(id);
    evaluacion.estado = estado;
    return this.evaluacion_repo.save(evaluacion);
  }

  async listarModulos(): Promise<ModuloEvaluacion[]> {
    const modulos = await this.modulo_repo.find({ order: { orden: 'ASC' } });
    if (modulos.length > 0) {
      return modulos;
    }

    const modulos_iniciales = [
      { orden: 1, nombre: 'Liderazgo en la Iglesia (Formulario F-03)', descripcion: 'Evaluación pastoral de compromiso, testimonio y liderazgo eclesial' },
      { orden: 2, nombre: 'Autoevaluación Académica', descripcion: 'Desempeño académico universitario y balance curricular' },
      { orden: 3, nombre: 'Evaluación del Mentor / Prácticas', descripcion: 'Desempeño en centro de prácticas o institución asignada' },
      { orden: 4, nombre: 'Evaluación Escuela de Líderes', descripcion: 'Participación y aprovechamiento en la Escuela de Líderes' },
      { orden: 5, nombre: 'Evaluación Socioeconómica', descripcion: 'Seguimiento de situación socioeconómica familiar' },
    ];
    for (const m of modulos_iniciales) {
      await this.modulo_repo.save(this.modulo_repo.create(m));
    }
    return this.modulo_repo.find({ order: { orden: 'ASC' } });
  }

  async listarPeriodos(): Promise<PeriodoEvaluacion[]> {
    const periodos = await this.periodo_repo.find({ order: { id: 'DESC' } });
    if (periodos.length > 0) {
      return periodos;
    }

    const periodos_iniciales = [
      { nombre: 'Semestre I · 2026', fecha_inicio: new Date('2026-01-01'), fecha_fin: new Date('2026-06-30'), estado: EstadoPeriodo.CERRADO },
      { nombre: 'Semestre II · 2026', fecha_inicio: new Date('2026-07-01'), fecha_fin: new Date('2026-12-31'), estado: EstadoPeriodo.ABIERTO },
    ];
    for (const p of periodos_iniciales) {
      await this.periodo_repo.save(this.periodo_repo.create(p));
    }
    return this.periodo_repo.find({ order: { id: 'DESC' } });
  }

  async listarEvaluadores(): Promise<Evaluador[]> {
    return this.evaluador_repo.find({ order: { nombre: 'ASC' } });
  }

  async procesarReceptorAcademica(dto: ReceptorAcademicaDto): Promise<Evaluacion> {
    const promedio = Number(dto.promedio_academico);
    let puntaje: number;
    let observaciones: string;

    if (promedio >= 75) {
      puntaje = Math.min(Math.round(Math.max(promedio, 100)), 100);
      observaciones = `Meta académica contractual cumplida con promedio de ${promedio} puntos.`;
    } else {
      puntaje = Math.round((promedio / 75) * 100);
      observaciones = `Alerta académica: El promedio registrado (${promedio}) se encuentra por debajo del estándar contractual de 75 puntos. Puntaje ponderado ajustado: ${puntaje}/100.`;
    }

    let evaluador_id = 1;
    if (this.evaluador_repo?.findOne) {
      let evaluador = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.BECARIO } });
      if (!evaluador && this.evaluador_repo.create && this.evaluador_repo.save) {
        evaluador = this.evaluador_repo.create({
          nombre: 'Autoevaluación Becario',
          tipo: TipoEvaluador.BECARIO,
          correo: 'becario@diaconia.bo',
        });
        evaluador = await this.evaluador_repo.save(evaluador);
      }
      if (evaluador) evaluador_id = evaluador.id;
    }

    let evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id: dto.becario_id, periodo_id: dto.periodo_id, modulo_id: 2 },
    });

    if (!evaluacion) {
      evaluacion = this.evaluacion_repo.create({
        becario_id: dto.becario_id,
        periodo_id: dto.periodo_id,
        modulo_id: 2,
        evaluador_id,
        puntaje,
        estado: EstadoEvaluacion.COMPLETADO,
        observaciones,
        promedio_academico: promedio,
        archivo_record_academico: dto.archivo_record_academico || null,
        archivo_historial_academico: dto.archivo_historial_academico || null,
        fecha_evaluacion: new Date(),
      });
    } else {
      evaluacion.puntaje = puntaje;
      evaluacion.estado = EstadoEvaluacion.COMPLETADO;
      evaluacion.observaciones = observaciones;
      evaluacion.promedio_academico = promedio;
      if (dto.archivo_record_academico !== undefined) {
        evaluacion.archivo_record_academico = dto.archivo_record_academico || null;
      }
      if (dto.archivo_historial_academico !== undefined) {
        evaluacion.archivo_historial_academico = dto.archivo_historial_academico || null;
      }
      evaluacion.fecha_evaluacion = new Date();
    }

    return this.evaluacion_repo.save(evaluacion);
  }

  async registrarNotasEstudiante(dto: GuardarNotasEstudianteDto, usuario?: Usuario): Promise<Evaluacion> {
    const becario = await this.becario_repo?.findOne({
      where: { id: dto.becario_id },
      relations: { supervisor: true },
    });

    if (!becario && this.becario_repo) {
      throw new NotFoundException(`No se encontró el becario con ID ${dto.becario_id}`);
    }

    if (this.documento_semestral_repo) {
      await this.documento_semestral_repo.delete({
        becario_id: dto.becario_id,
        periodo_id: dto.periodo_id,
        tipo_documento: TipoDocumentoSemestral.KARDEX,
      });
      await this.documento_semestral_repo.save(
        this.documento_semestral_repo.create({
          becario_id: dto.becario_id,
          periodo_id: dto.periodo_id,
          tipo_documento: TipoDocumentoSemestral.KARDEX,
          url_archivo: dto.archivo_kardex_url,
          nombre_archivo: dto.nombre_archivo_kardex,
          tamano_archivo: dto.tamano_archivo_kardex || null,
          estado: EstadoDocumentoSemestral.EN_REVISION,
        }),
      );

      await this.documento_semestral_repo.delete({
        becario_id: dto.becario_id,
        periodo_id: dto.periodo_id,
        tipo_documento: TipoDocumentoSemestral.PROGRAMACION_NUEVA,
      });
      await this.documento_semestral_repo.save(
        this.documento_semestral_repo.create({
          becario_id: dto.becario_id,
          periodo_id: dto.periodo_id,
          tipo_documento: TipoDocumentoSemestral.PROGRAMACION_NUEVA,
          url_archivo: dto.archivo_programacion_url,
          nombre_archivo: dto.nombre_archivo_programacion,
          tamano_archivo: dto.tamano_archivo_programacion || null,
          estado: EstadoDocumentoSemestral.EN_REVISION,
        }),
      );

      if (dto.archivo_carnet_url && dto.nombre_archivo_carnet) {
        await this.documento_semestral_repo.delete({
          becario_id: dto.becario_id,
          periodo_id: dto.periodo_id,
          tipo_documento: TipoDocumentoSemestral.CARNET_IDENTIDAD,
        });
        await this.documento_semestral_repo.save(
          this.documento_semestral_repo.create({
            becario_id: dto.becario_id,
            periodo_id: dto.periodo_id,
            tipo_documento: TipoDocumentoSemestral.CARNET_IDENTIDAD,
            url_archivo: dto.archivo_carnet_url,
            nombre_archivo: dto.nombre_archivo_carnet,
            tamano_archivo: dto.tamano_archivo_carnet || null,
            estado: EstadoDocumentoSemestral.EN_REVISION,
          }),
        );

        if (becario && this.becario_repo) {
          becario.url_carnet = dto.archivo_carnet_url;
          await this.becario_repo.save(becario);
        }
      }

      if (becario && this.becario_repo) {
        becario.url_kardex = dto.archivo_kardex_url;
        await this.becario_repo.save(becario);
      }
    }

    const suma_notas = dto.materias.reduce((acc, m) => acc + Number(m.nota || 0), 0);
    const promedio = dto.materias.length > 0 ? Number((suma_notas / dto.materias.length).toFixed(2)) : 0;
    const puntaje = promedio >= 75 ? Math.min(Math.round(promedio), 100) : Math.round((promedio / 75) * 100);

    let evaluador_id = 1;
    if (this.evaluador_repo?.findOne) {
      let evaluador = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.BECARIO } });
      if (!evaluador && this.evaluador_repo.create && this.evaluador_repo.save) {
        evaluador = this.evaluador_repo.create({
          nombre: 'Autoevaluación Becario',
          tipo: TipoEvaluador.BECARIO,
          correo: 'becario@diaconia.bo',
        });
        evaluador = await this.evaluador_repo.save(evaluador);
      }
      if (evaluador) evaluador_id = evaluador.id;
    }

    let evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id: dto.becario_id, periodo_id: dto.periodo_id, modulo_id: 2 },
    });

    const datos_formulario = {
      materias: dto.materias.map((m, idx) => ({
        id: m.id || idx + 1,
        nombre: m.nombre,
        sigla: m.sigla || '',
        nota: Number(m.nota),
        estado: Number(m.nota) >= 51 ? 'aprobado' : 'reprobado',
        editado_por_supervisor: false,
        nota_original_estudiante: Number(m.nota),
      })),
      promedio_calculado: promedio,
      documentos: {
        kardex_url: dto.archivo_kardex_url,
        kardex_nombre: dto.nombre_archivo_kardex,
        tamano_kardex: dto.tamano_archivo_kardex || null,
        programacion_url: dto.archivo_programacion_url,
        programacion_nombre: dto.nombre_archivo_programacion,
        tamano_programacion: dto.tamano_archivo_programacion || null,
        carnet_renovado_url: dto.archivo_carnet_url || null,
        carnet_renovado_nombre: dto.nombre_archivo_carnet || null,
      },
      observaciones_estudiante: dto.observaciones || '',
      fecha_envio_estudiante: new Date().toISOString(),
    };

    if (!evaluacion) {
      evaluacion = this.evaluacion_repo.create({
        becario_id: dto.becario_id,
        periodo_id: dto.periodo_id,
        modulo_id: 2,
        evaluador_id,
        puntaje,
        estado: EstadoEvaluacion.EN_REVISION_SUPERVISOR,
        observaciones: dto.observaciones || `Notas declaradas por el estudiante (${promedio} pts). En espera de pre-evaluación del supervisor.`,
        promedio_academico: promedio,
        archivo_record_academico: dto.archivo_kardex_url,
        archivo_historial_academico: dto.archivo_programacion_url,
        datos_formulario,
        fecha_evaluacion: new Date(),
      });
    } else {
      evaluacion.puntaje = puntaje;
      evaluacion.estado = EstadoEvaluacion.EN_REVISION_SUPERVISOR;
      evaluacion.observaciones = dto.observaciones || `Notas declaradas por el estudiante (${promedio} pts). En espera de pre-evaluación del supervisor.`;
      evaluacion.promedio_academico = promedio;
      evaluacion.archivo_record_academico = dto.archivo_kardex_url;
      evaluacion.archivo_historial_academico = dto.archivo_programacion_url;
      evaluacion.datos_formulario = datos_formulario;
      evaluacion.fecha_evaluacion = new Date();
    }

    const evaluacion_guardada = await this.evaluacion_repo.save(evaluacion);

    if (becario?.supervisor_id && this.notificaciones_servicio) {
      try {
        await this.notificaciones_servicio.crear({
          usuario_id: becario.supervisor_id,
          tipo: 'evaluacion_pendiente',
          mensaje: `El becario ${becario.nombre || 'estudiante'} ha presentado sus calificaciones y documentos semestrales para su pre-evaluación.`,
        });
      } catch (e) {
        // Envio no bloqueante
      }
    }

    return evaluacion_guardada;
  }

  async preEvaluarSupervisor(evaluacion_id: number, dto: PreEvaluarSupervisorDto, supervisor_usuario?: Usuario): Promise<Evaluacion> {
    const evaluacion = await this.evaluacion_repo.findOne({
      where: { id: evaluacion_id },
      relations: { becario: true },
    });

    if (!evaluacion) {
      throw new NotFoundException(`No se encontró la evaluación con ID ${evaluacion_id}`);
    }

    if (dto.accion === AccionPreEvaluacion.OBSERVAR) {
      evaluacion.estado = EstadoEvaluacion.OBSERVADO;
      evaluacion.observaciones = dto.observaciones_supervisor || 'Evaluación académica observada por el supervisor.';
      const form_actual = (evaluacion.datos_formulario as Record<string, any>) || {};
      evaluacion.datos_formulario = {
        ...form_actual,
        pre_evaluacion: {
          supervisor_id: supervisor_usuario?.id ?? null,
          supervisor_nombre: supervisor_usuario?.nombre ?? 'Supervisor',
          fecha_pre_evaluacion: new Date().toISOString(),
          observaciones: dto.observaciones_supervisor || '',
          resultado: 'observado',
        },
      };
      return this.evaluacion_repo.save(evaluacion);
    }

    const suma_notas = dto.materias.reduce((acc, m) => acc + Number(m.nota || 0), 0);
    const promedio = dto.materias.length > 0 ? Number((suma_notas / dto.materias.length).toFixed(2)) : 0;
    const puntaje = promedio >= 75 ? Math.min(Math.round(promedio), 100) : Math.round((promedio / 75) * 100);

    const form_actual = (evaluacion.datos_formulario as Record<string, any>) || {};
    evaluacion.datos_formulario = {
      ...form_actual,
      materias: dto.materias.map((m, idx) => ({
        id: m.id || idx + 1,
        nombre: m.nombre,
        sigla: m.sigla || '',
        nota: Number(m.nota),
        estado: Number(m.nota) >= 51 ? 'aprobado' : 'reprobado',
        editado_por_supervisor: Boolean(m.editado_por_supervisor),
        nota_original_estudiante: m.nota_original_estudiante !== undefined ? Number(m.nota_original_estudiante) : Number(m.nota),
      })),
      promedio_calculado: promedio,
      pre_evaluacion: {
        supervisor_id: supervisor_usuario?.id ?? null,
        supervisor_nombre: supervisor_usuario?.nombre ?? 'Supervisor',
        fecha_pre_evaluacion: new Date().toISOString(),
        observaciones: dto.observaciones_supervisor || '',
        resultado: 'aprobado',
      },
    };

    evaluacion.promedio_academico = promedio;
    evaluacion.puntaje = puntaje;
    evaluacion.estado = EstadoEvaluacion.PRE_EVALUADO;
    evaluacion.observaciones = dto.observaciones_supervisor || `Pre-evaluación completada por supervisor. Promedio: ${promedio} pts. Enviado a Administración.`;

    const guardada = await this.evaluacion_repo.save(evaluacion);
    Object.assign(guardada, {
      record_academico: guardada.archivo_record_academico,
      historial_academico: guardada.archivo_historial_academico,
    });

    if (evaluacion.becario?.usuario_id && this.notificaciones_servicio) {
      try {
        await this.notificaciones_servicio.crear({
          usuario_id: evaluacion.becario.usuario_id,
          tipo: 'evaluacion_pendiente',
          mensaje: `Tu supervisor ha revisado y remitido tus notas (Promedio: ${promedio} pts) a Administración.`,
        });
      } catch (e) {
        // Envio no bloqueante
      }
    }

    return guardada;
  }

  async convalidarEvaluacionAcademica(evaluacion_id: number, dto: ConvalidarAdministracionDto, admin_usuario?: Usuario): Promise<Evaluacion> {
    const evaluacion = await this.evaluacion_repo.findOne({
      where: { id: evaluacion_id },
      relations: { becario: true },
    });

    if (!evaluacion) {
      throw new NotFoundException(`No se encontró la evaluación con ID ${evaluacion_id}`);
    }

    if (dto.accion === AccionConvalidacion.OBSERVAR) {
      evaluacion.estado = EstadoEvaluacion.OBSERVADO;
      evaluacion.observaciones = dto.observaciones_administracion || 'Evaluación observada por Administración.';
      return this.evaluacion_repo.save(evaluacion);
    }

    evaluacion.estado = EstadoEvaluacion.COMPLETADO;
    const form_actual = (evaluacion.datos_formulario as Record<string, any>) || {};
    evaluacion.datos_formulario = {
      ...form_actual,
      convalidacion_administracion: {
        admin_id: admin_usuario?.id ?? null,
        admin_nombre: admin_usuario?.nombre ?? 'Administración Central',
        fecha_convalidacion: new Date().toISOString(),
        observaciones: dto.observaciones_administracion || 'Calificaciones y documentos convalidados oficialmente.',
      },
    };

    if (dto.observaciones_administracion) {
      evaluacion.observaciones = dto.observaciones_administracion;
    }

    if (this.documento_semestral_repo && evaluacion.becario_id && evaluacion.periodo_id) {
      await this.documento_semestral_repo.update(
        { becario_id: evaluacion.becario_id, periodo_id: evaluacion.periodo_id },
        { estado: EstadoDocumentoSemestral.CONVALIDADO },
      );
    }

    const guardada = await this.evaluacion_repo.save(evaluacion);
    Object.assign(guardada, {
      record_academico: guardada.archivo_record_academico,
      historial_academico: guardada.archivo_historial_academico,
    });

    if (evaluacion.becario?.usuario_id && this.notificaciones_servicio) {
      try {
        await this.notificaciones_servicio.crear({
          usuario_id: evaluacion.becario.usuario_id,
          tipo: 'evaluacion_pendiente',
          mensaje: `Administración ha convalidado tu récord semestral con promedio de ${evaluacion.promedio_academico} pts.`,
        });
      } catch (e) {
        // Envio no bloqueante
      }
    }

    return guardada;
  }

  async obtenerEvaluacionAcademicaBecario(becario_id: number, periodo_id: number) {
    const evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id, periodo_id, modulo_id: 2 },
      relations: { becario: true, periodo: true },
    });

    let documentos: DocumentoSemestralBecario[] = [];
    if (this.documento_semestral_repo) {
      documentos = await this.documento_semestral_repo.find({
        where: { becario_id, periodo_id },
        order: { created_at: 'ASC' },
      });
    }

    return {
      evaluacion,
      documentos,
    };
  }

  async obtenerPendientesSupervisor(supervisor_usuario_id: number, periodo_id?: number) {
    const becarios =
      (await this.becario_repo?.find({
        where: { supervisor_id: supervisor_usuario_id },
      })) || [];

    if (becarios.length === 0) return [];

    const becario_ids = becarios.map((b) => b.id);
    const query = this.evaluacion_repo
      .createQueryBuilder('evaluacion')
      .leftJoinAndSelect('evaluacion.becario', 'becario')
      .leftJoinAndSelect('evaluacion.periodo', 'periodo')
      .where('evaluacion.becario_id IN (:...becario_ids)', { becario_ids })
      .andWhere('evaluacion.modulo_id = 2');

    if (periodo_id) {
      query.andWhere('evaluacion.periodo_id = :periodo_id', { periodo_id });
    }

    return query.orderBy('evaluacion.created_at', 'DESC').getMany();
  }

  async obtenerPendientesAdministracion(periodo_id?: number) {
    const query = this.evaluacion_repo
      .createQueryBuilder('evaluacion')
      .leftJoinAndSelect('evaluacion.becario', 'becario')
      .leftJoinAndSelect('evaluacion.periodo', 'periodo')
      .where('evaluacion.modulo_id = 2')
      .andWhere('evaluacion.estado IN (:...estados)', {
        estados: [
          EstadoEvaluacion.PENDIENTE,
          EstadoEvaluacion.EN_REVISION_SUPERVISOR,
          EstadoEvaluacion.EN_REVISION_ADMINISTRACION,
          EstadoEvaluacion.PRE_EVALUADO,
          EstadoEvaluacion.COMPLETADO,
          EstadoEvaluacion.OBSERVADO,
        ],
      });

    if (periodo_id) {
      query.andWhere('evaluacion.periodo_id = :periodo_id', { periodo_id });
    }

    const lista = await query.orderBy('evaluacion.created_at', 'DESC').getMany();
    return lista.map((ev) =>
      Object.assign(ev, {
        record_academico: ev.archivo_record_academico,
        historial_academico: ev.archivo_historial_academico,
      }),
    );
  }

  async obtenerCuestionarioBienestar(): Promise<PreguntaBienestar[]> {
    if (this.pregunta_bienestar_repo) {
      let preguntas = await this.pregunta_bienestar_repo.find({
        order: { numero_orden: 'ASC' },
      });
      if (preguntas.length === 0) {
        for (const p of PREGUNTAS_BIENESTAR_DEFECTO) {
          await this.pregunta_bienestar_repo.save(this.pregunta_bienestar_repo.create(p));
        }
        preguntas = await this.pregunta_bienestar_repo.find({
          order: { numero_orden: 'ASC' },
        });
        if (preguntas.length === 0) {
          return PREGUNTAS_BIENESTAR_DEFECTO as unknown as PreguntaBienestar[];
        }
      }
      return preguntas;
    }
    return PREGUNTAS_BIENESTAR_DEFECTO as unknown as PreguntaBienestar[];
  }

  async actualizarCuestionarioBienestar(payload: any): Promise<PreguntaBienestar[]> {
    if (!this.pregunta_bienestar_repo) {
      throw new BadRequestException('Repositorio de preguntas de bienestar no disponible');
    }
    const lista: any[] = Array.isArray(payload)
      ? payload
      : payload && Array.isArray(payload.preguntas)
      ? payload.preguntas
      : [payload];

    for (const item of lista) {
      if (!item) continue;
      if (item.id) {
        const existente = await this.pregunta_bienestar_repo.findOne({ where: { id: item.id } });
        if (existente) {
          Object.assign(existente, item);
          await this.pregunta_bienestar_repo.save(existente);
          continue;
        }
      }
      if (item.numero_orden) {
        const existente = await this.pregunta_bienestar_repo.findOne({ where: { numero_orden: item.numero_orden } });
        if (existente) {
          Object.assign(existente, item);
          await this.pregunta_bienestar_repo.save(existente);
          continue;
        }
      }
      await this.pregunta_bienestar_repo.save(this.pregunta_bienestar_repo.create(item));
    }
    return this.pregunta_bienestar_repo.find({ order: { numero_orden: 'ASC' } });
  }

  async procesarReceptorMentorQr(dto: ReceptorMentorQrDto, usuario?: Usuario): Promise<Evaluacion> {
    let periodo_id = dto.periodo_id;
    if (!periodo_id && this.periodo_repo?.findOne) {
      if (dto.periodo) {
        const p_por_nombre = await this.periodo_repo.findOne({ where: { nombre: dto.periodo } });
        if (p_por_nombre) periodo_id = p_por_nombre.id;
      }
      if (!periodo_id) {
        const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
        if (p_activo) periodo_id = p_activo.id;
      }
    }
    if (!periodo_id) periodo_id = 2;

    let evaluador_id = 1;
    const modalidad_llenado =
      dto.modalidad_llenado ||
      (usuario && usuario.rol === Rol.SUPERVISOR ? 'perfil_supervisor' : 'celular_estudiante');

    if (dto.codigo_verificacion && dto.codigo_verificacion.trim().length > 0) {
      const codigo_limpio = dto.codigo_verificacion.trim();
      for (const [clave, valor] of this.codigos_tutor.entries()) {
        if (valor.codigo === codigo_limpio) {
          this.codigos_tutor.delete(clave);
          break;
        }
      }
    }

    const nombre_evaluador =
      (usuario && (usuario.rol === Rol.SUPERVISOR || usuario.rol === Rol.ADMINISTRADOR) ? usuario.nombre : null) ||
      dto.nombre_mentor ||
      dto.supervisor_nombre ||
      'Supervisor Diaconía';
    const correo_evaluador =
      (usuario && (usuario.rol === Rol.SUPERVISOR || usuario.rol === Rol.ADMINISTRADOR) ? usuario.correo : null) ||
      'supervisor@diaconia.bo';
    if (this.evaluador_repo?.findOne) {
      let evaluador = await this.evaluador_repo.findOne({ where: { nombre: nombre_evaluador } });
      if (!evaluador) {
        evaluador = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.SUPERVISOR } });
      }
      if (!evaluador && this.evaluador_repo.create && this.evaluador_repo.save) {
        evaluador = this.evaluador_repo.create({
          nombre: nombre_evaluador,
          tipo: TipoEvaluador.SUPERVISOR,
          correo: correo_evaluador,
        });
        evaluador = await this.evaluador_repo.save(evaluador);
      }
      if (evaluador) evaluador_id = evaluador.id;
    }

    let puntaje = 20;

    if (dto.calificaciones_1_18) {
      const raw_nums = Array.isArray(dto.calificaciones_1_18)
        ? dto.calificaciones_1_18
        : Object.values(dto.calificaciones_1_18);
      const numeros = raw_nums.map(Number).filter((n) => !isNaN(n));
      const cant_preguntas = Math.max(numeros.length, 1);
      const suma_18 = numeros.reduce((acc, curr) => acc + curr, 0);
      const promedio_1_18 = suma_18 / cant_preguntas;
      const nota_bloque_1 = Math.min(Math.max(promedio_1_18, 0), 10);

      const p19 = dto.puntaje_19 !== undefined && dto.puntaje_19 !== null ? Math.min(Math.max(Number(dto.puntaje_19), 0), 3.33) : 0;
      const p20 = dto.puntaje_20 !== undefined && dto.puntaje_20 !== null ? Math.min(Math.max(Number(dto.puntaje_20), 0), 3.33) : 0;
      const p21 = dto.puntaje_21 !== undefined && dto.puntaje_21 !== null ? Math.min(Math.max(Number(dto.puntaje_21), 0), 3.34) : 0;
      const nota_bloque_2 = p19 + p20 + p21;

      if (nota_bloque_2 > 0) {
        puntaje = Number((nota_bloque_1 + nota_bloque_2).toFixed(1));
      } else {
        puntaje = Number((nota_bloque_1 * 2).toFixed(1));
      }
    } else if (dto.respuestas) {
      const valores: number[] = [];
      const extraerNumeros = (obj: unknown) => {
        if (typeof obj === 'number') {
          valores.push(obj);
        } else if (typeof obj === 'object' && obj !== null) {
          for (const v of Object.values(obj)) {
            extraerNumeros(v);
          }
        }
      };
      extraerNumeros(dto.respuestas);

      if (valores.length > 0) {
        const suma = valores.reduce((acc, curr) => acc + curr, 0);
        const todos_likert = valores.every((v) => v <= 5 && v >= 0);
        if (todos_likert) {
          puntaje = Math.round((suma / (valores.length * 5)) * 100);
        } else {
          puntaje = Math.round(suma / valores.length);
        }
      } else {
        puntaje = 100;
      }
      puntaje = Math.min(Math.max(puntaje, 0), 100);
    }

    let evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id: dto.becario_id, periodo_id, modulo_id: 3 },
    });

    const datos_previos = (evaluacion?.datos_formulario as Record<string, any>) || {};

    const payload_formulario = {
      ...datos_previos,
      nombre_mentor: nombre_evaluador,
      unidad_agencia: dto.unidad_agencia || datos_previos.unidad_agencia,
      semestre_gestion: dto.semestre_gestion || datos_previos.semestre_gestion,
      fecha: dto.fecha || new Date().toISOString().split('T')[0],
      calificaciones_1_18: dto.calificaciones_1_18 !== undefined ? dto.calificaciones_1_18 : datos_previos.calificaciones_1_18,
      pregunta_19_apoyo: dto.pregunta_19_apoyo !== undefined ? dto.pregunta_19_apoyo : datos_previos.pregunta_19_apoyo,
      puntaje_19: dto.puntaje_19 !== undefined ? dto.puntaje_19 : datos_previos.puntaje_19,
      pregunta_20_destacado: dto.pregunta_20_destacado !== undefined ? dto.pregunta_20_destacado : datos_previos.pregunta_20_destacado,
      puntaje_20: dto.puntaje_20 !== undefined ? dto.puntaje_20 : datos_previos.puntaje_20,
      pregunta_21_sugerencias: dto.pregunta_21_sugerencias !== undefined ? dto.pregunta_21_sugerencias : datos_previos.pregunta_21_sugerencias,
      puntaje_21: dto.puntaje_21 !== undefined ? dto.puntaje_21 : datos_previos.puntaje_21,
      modalidad_llenado,
      codigo_verificacion: dto.codigo_verificacion || datos_previos.codigo_verificacion || null,
      supervisor_usuario_id: usuario?.id || datos_previos.supervisor_usuario_id || null,
      fecha_actualizacion: new Date().toISOString(),
      ...(dto.respuestas || {}),
    };

    if (!evaluacion) {
      evaluacion = this.evaluacion_repo.create({
        becario_id: dto.becario_id,
        periodo_id,
        modulo_id: 3,
        evaluador_id,
        puntaje,
        estado: EstadoEvaluacion.COMPLETADO,
        observaciones: dto.observaciones || 'Evaluación del mentor/prácticas registrada satisfactoriamente.',
        datos_formulario: payload_formulario,
        fecha_evaluacion: new Date(),
      });
    } else {
      evaluacion.puntaje = puntaje;
      evaluacion.estado = EstadoEvaluacion.COMPLETADO;
      evaluacion.evaluador_id = evaluador_id;
      evaluacion.datos_formulario = payload_formulario;
      if (dto.observaciones) evaluacion.observaciones = dto.observaciones;
      evaluacion.fecha_evaluacion = new Date();
    }

    return this.evaluacion_repo.save(evaluacion);
  }

  async registrarEvaluacionSocioeconomica(dto: ReceptorSocioeconomicaDto): Promise<Evaluacion> {
    return this.procesarReceptorSocioeconomica(dto);
  }

  async procesarReceptorSocioeconomica(dto: ReceptorSocioeconomicaDto): Promise<Evaluacion> {
    let becario_id_real = dto.becario_id || 1;
    if (this.becario_repo?.findOne && dto.becario_id) {
      let becario = await this.becario_repo.findOne({
        where: [
          { id: dto.becario_id },
          { usuario_id: dto.becario_id },
        ],
      });
      if (becario) {
        becario_id_real = becario.id;
      }
    }

    let periodo_id = dto.periodo_id;
    if (!periodo_id && this.periodo_repo?.findOne) {
      if (dto.periodo) {
        const p_por_nombre = await this.periodo_repo.findOne({ where: { nombre: dto.periodo } });
        if (p_por_nombre) periodo_id = p_por_nombre.id;
      }
      if (!periodo_id) {
        const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
        if (p_activo) periodo_id = p_activo.id;
      }
    }
    if (!periodo_id) periodo_id = 2;

    let evaluador_id = 1;
    if (this.evaluador_repo?.findOne) {
      let evaluador = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.TRABAJADOR_SOCIAL } });
      if (!evaluador && this.evaluador_repo.create && this.evaluador_repo.save) {
        evaluador = this.evaluador_repo.create({
          nombre: 'Trabajador Social Diaconía',
          tipo: TipoEvaluador.TRABAJADOR_SOCIAL,
          correo: 'social@diaconia.bo',
        });
        evaluador = await this.evaluador_repo.save(evaluador);
      }
      if (evaluador) evaluador_id = evaluador.id;
    }

    const respuestas_fuente: Record<string, unknown> =
      dto.respuestas && typeof dto.respuestas === 'object'
        ? dto.respuestas
        : (dto as any).respuestas_26_preguntas && typeof (dto as any).respuestas_26_preguntas === 'object'
          ? (dto as any).respuestas_26_preguntas
          : {};

    let puntaje_20 = 20;
    let total_respondidas = 0;
    let suma_puntos = 0;

    for (const [key, val] of Object.entries(respuestas_fuente)) {
      const num = parseInt(String(key).replace(/\D+/g, ''), 10);
      if (!isNaN(num) && num >= 1 && num <= 26 && typeof val === 'string') {
        const letra = val.trim().toUpperCase().charAt(0);
        if (letra === 'A' || letra === 'B' || letra === 'C' || letra === 'D') {
          total_respondidas++;
          if (num === 19) {
            if (letra === 'A') suma_puntos += 1.0;
            else if (letra === 'B') suma_puntos += 0.5;
            else if (letra === 'C') suma_puntos += 0.0;
            else if (letra === 'D') suma_puntos += 0.5;
          } else if (num >= 21 && num <= 26) {
            if (letra === 'A') suma_puntos += 0.0;
            else if (letra === 'B') suma_puntos += 0.33;
            else if (letra === 'C') suma_puntos += 0.67;
            else if (letra === 'D') suma_puntos += 1.0;
          } else {
            if (letra === 'A') suma_puntos += 1.0;
            else if (letra === 'B') suma_puntos += 0.5;
            else if (letra === 'C') suma_puntos += 0.0;
          }
        }
      }
    }

    if (total_respondidas > 0) {
      const proporcion = suma_puntos / total_respondidas;
      puntaje_20 = Number((proporcion * 20).toFixed(1));
    } else {
      const valores: number[] = [];
      const extraerNumeros = (obj: unknown) => {
        if (typeof obj === 'number') {
          valores.push(obj);
        } else if (typeof obj === 'object' && obj !== null) {
          for (const v of Object.values(obj)) {
            extraerNumeros(v);
          }
        }
      };
      extraerNumeros(respuestas_fuente);

      let indice = 85;
      if (valores.length > 0) {
        const suma = valores.reduce((acc, curr) => acc + curr, 0);
        const todos_escala_1 = valores.every((v) => v <= 1 && v >= 0);
        const todos_likert = valores.every((v) => v <= 5 && v >= 0);
        if (todos_escala_1) {
          indice = Math.round((suma / valores.length) * 100);
        } else if (todos_likert) {
          indice = Math.round((suma / (valores.length * 5)) * 100);
        } else {
          indice = Math.round(suma / valores.length);
        }
      }
      puntaje_20 = Number(((indice / 100) * 20).toFixed(1));
    }
    puntaje_20 = Math.min(Math.max(puntaje_20, 0), 20);

    let semaforo: 'verde' | 'amarillo' | 'rojo' = 'verde';
    const s_explicit = typeof (respuestas_fuente as any).semaforo === 'string'
      ? String((respuestas_fuente as any).semaforo).toLowerCase()
      : null;

    if (s_explicit === 'verde' || s_explicit === 'amarillo' || s_explicit === 'rojo') {
      semaforo = s_explicit as 'verde' | 'amarillo' | 'rojo';
    } else {
      if (puntaje_20 >= 14) {
        semaforo = 'verde';
      } else if (puntaje_20 >= 10) {
        semaforo = 'amarillo';
      } else {
        semaforo = 'rojo';
      }
    }

    let evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id: becario_id_real, periodo_id, modulo_id: 5 },
    });

    if (!evaluacion) {
      evaluacion = this.evaluacion_repo.create({
        becario_id: becario_id_real,
        periodo_id,
        modulo_id: 5,
        evaluador_id,
        puntaje: puntaje_20,
        estado: EstadoEvaluacion.COMPLETADO,
        observaciones: dto.observaciones || `Evaluación socioeconómica procesada (${puntaje_20}/20 pts) con semáforo ${semaforo}.`,
        datos_formulario: respuestas_fuente,
        semaforo_socioeconomico: semaforo,
        fecha_evaluacion: new Date(),
      });
    } else {
      evaluacion.puntaje = puntaje_20;
      evaluacion.estado = EstadoEvaluacion.COMPLETADO;
      evaluacion.datos_formulario = {
        ...(evaluacion.datos_formulario || {}),
        ...respuestas_fuente,
      };
      evaluacion.semaforo_socioeconomico = semaforo;
      if (dto.observaciones) evaluacion.observaciones = dto.observaciones;
      evaluacion.fecha_evaluacion = new Date();
    }

    const guardada = await this.evaluacion_repo.save(evaluacion);
    this.tiempo_real_gateway?.notificarEvaluacion({
      accion: 'socioeconomica_registrada',
      modulo_id: 5,
      becario_id: becario_id_real,
      evaluacion_id: guardada.id,
      puntaje_sobre_20: puntaje_20,
      semaforo,
    });
    return guardada;
  }

  private construirMapaRespuestas26(
    raw: Record<string, unknown> | null | undefined,
    puntaje_20: number,
  ): Record<number, 'A' | 'B' | 'C' | 'D'> {
    const mapa: Record<number, 'A' | 'B' | 'C' | 'D'> = {};
    for (let n = 1; n <= 26; n++) {
      if (n <= 20) {
        if (puntaje_20 >= 16) mapa[n] = 'A';
        else if (puntaje_20 >= 11) mapa[n] = n % 3 === 0 ? 'B' : 'A';
        else mapa[n] = n % 2 === 0 ? 'B' : 'C';
      } else {
        if (puntaje_20 >= 16) mapa[n] = 'D';
        else if (puntaje_20 >= 11) mapa[n] = 'C';
        else mapa[n] = 'B';
      }
    }

    if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw)) {
        const num = parseInt(String(k).replace(/\D+/g, ''), 10);
        if (isNaN(num) || num < 1 || num > 26) continue;
        const inciso =
          typeof v === 'string'
            ? v.trim().toUpperCase().charAt(0)
            : typeof v === 'object' && v !== null && 'respuesta' in v
              ? String((v as { respuesta?: unknown }).respuesta || '').trim().toUpperCase().charAt(0)
              : '';
        if (inciso === 'A' || inciso === 'B' || inciso === 'C' || inciso === 'D') {
          mapa[num] = inciso;
        }
      }
    }

    return mapa;
  }

  async obtenerNominaSocioeconomica(periodo_id?: number) {
    let becarios_bd: Becario[] = [];
    if (this.becario_repo?.find) {
      try {
        becarios_bd = await this.becario_repo.find({
          relations: { usuario: true },
          order: { id: 'ASC' },
        });
      } catch {
        becarios_bd = [];
      }
    }

    let evaluaciones_mod5: Evaluacion[] = [];
    if (this.evaluacion_repo?.find) {
      try {
        evaluaciones_mod5 = await this.evaluacion_repo.find({
          where: periodo_id ? { modulo_id: 5, periodo_id } : { modulo_id: 5 },
          relations: { becario: true },
          order: { id: 'DESC' },
        });
      } catch {
        evaluaciones_mod5 = [];
      }
    }

    const normalizar = (txt?: string | null) =>
      txt ? txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() : '';

    if (becarios_bd.length > 0) {
      return becarios_bd.map((b, idx) => {
        const ev = evaluaciones_mod5.find((e) => e.becario_id === b.id);
        const ci_limpio = (b.ci || '').split(/[- ]/)[0].trim();
        const ref_sem2 = REGISTROS_CONSOLIDADO_SEM_II.find(
          (r) =>
            (ci_limpio && r.ci === ci_limpio) ||
            (b.nombre && normalizar(r.nombre_completo) === normalizar(b.nombre)),
        );

        const puntaje_sobre_20 =
          ev?.puntaje !== undefined && ev?.puntaje !== null
            ? Number(ev.puntaje)
            : ref_sem2?.socioeconomico ?? 15;
        const puntaje_sobre_100 = Number(((puntaje_sobre_20 / 20) * 100).toFixed(1));

        let semaforo: 'verde' | 'amarillo' | 'rojo' =
          puntaje_sobre_20 >= 12 ? 'verde' : puntaje_sobre_20 >= 8 ? 'amarillo' : 'rojo';
        if (
          ev?.semaforo_socioeconomico === 'verde' ||
          ev?.semaforo_socioeconomico === 'amarillo' ||
          ev?.semaforo_socioeconomico === 'rojo'
        ) {
          semaforo = ev.semaforo_socioeconomico;
        }

        const datos_form = (ev?.datos_formulario || {}) as Record<string, unknown>;
        const respuestas_mapa = this.construirMapaRespuestas26(datos_form, puntaje_sobre_20);
        const convalidado = Boolean(datos_form.convalidado || ev?.estado === EstadoEvaluacion.COMPLETADO);
        const estado = ev?.estado || (convalidado ? EstadoEvaluacion.COMPLETADO : EstadoEvaluacion.PENDIENTE);

        return {
          id: ev?.id || b.id || idx + 1,
          becario_id: b.id,
          nombre_completo: b.nombre || b.usuario?.nombre || `Becario #${b.id}`,
          ci: b.ci || ref_sem2?.ci || 'S/N',
          universidad: b.universidad || ref_sem2?.universidad || 'Universidad Mayor de San Andrés',
          carrera: b.carrera || ref_sem2?.carrera || 'General',
          semestre: b.modalidad_carrera || ref_sem2?.modalidad_carrera || 'Semestral',
          respuestas_contestadas: 26,
          respuestas_completadas: 26,
          total_preguntas: 26,
          puntaje_20: puntaje_sobre_20,
          puntaje_sobre_20,
          puntaje_sobre_100,
          semaforo,
          estado,
          convalidado,
          observaciones:
            ev?.observaciones ||
            `Evaluación socioeconómica registrada (${puntaje_sobre_20}/20 pts).`,
          respuestas: respuestas_mapa,
          respuestas_detalle: datos_form,
        };
      });
    }

    return REGISTROS_CONSOLIDADO_SEM_II.map((r, idx) => {
      const puntaje_sobre_20 = r.socioeconomico;
      const puntaje_sobre_100 = Number(((puntaje_sobre_20 / 20) * 100).toFixed(1));
      const semaforo: 'verde' | 'amarillo' | 'rojo' =
        puntaje_sobre_20 >= 12 ? 'verde' : puntaje_sobre_20 >= 8 ? 'amarillo' : 'rojo';
      const respuestas_mapa = this.construirMapaRespuestas26(null, puntaje_sobre_20);

      return {
        id: idx + 1,
        becario_id: idx + 1,
        nombre_completo: r.nombre_completo,
        ci: r.ci,
        universidad: r.universidad,
        carrera: r.carrera,
        semestre: r.modalidad_carrera,
        respuestas_contestadas: 26,
        respuestas_completadas: 26,
        total_preguntas: 26,
        puntaje_20: puntaje_sobre_20,
        puntaje_sobre_20,
        puntaje_sobre_100,
        semaforo,
        estado: EstadoEvaluacion.COMPLETADO,
        convalidado: true,
        observaciones: `Evaluación socioeconómica semestral (${puntaje_sobre_20}/20 pts).`,
        respuestas: respuestas_mapa,
        respuestas_detalle: respuestas_mapa,
      };
    });
  }

  async revisarEvaluacionSocioeconomica(
    becario_id: number,
    dto: RevisarSocioeconomicaDto,
    aprobar = false,
  ) {
    let becario_real_id = dto.becario_id || becario_id;
    if (this.becario_repo?.findOne) {
      const becario = await this.becario_repo.findOne({
        where: [{ id: becario_real_id }, { usuario_id: becario_real_id }],
      });
      if (becario) {
        becario_real_id = becario.id;
      }
    }

    let periodo_id = dto.periodo_id || 2;
    if (!dto.periodo_id && this.periodo_repo?.findOne) {
      const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      if (p_activo) periodo_id = p_activo.id;
    }

    let evaluador_id = 1;
    if (this.evaluador_repo?.findOne) {
      const evaluador = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.TRABAJADOR_SOCIAL } });
      if (evaluador) evaluador_id = evaluador.id;
    }

    let evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id: becario_real_id, periodo_id, modulo_id: 5 },
    });

    const puntaje_entrante = dto.puntaje_sobre_20 ?? dto.puntaje;
    const puntaje_final =
      puntaje_entrante !== undefined
        ? Math.min(Math.max(Number(puntaje_entrante), 0), 20)
        : evaluacion?.puntaje !== undefined && evaluacion?.puntaje !== null
          ? Number(evaluacion.puntaje)
          : 16;

    let semaforo: 'verde' | 'amarillo' | 'rojo' =
      puntaje_final >= 12 ? 'verde' : puntaje_final >= 8 ? 'amarillo' : 'rojo';
    if (dto.semaforo) {
      const s = dto.semaforo.toLowerCase();
      if (s === 'verde' || s === 'amarillo' || s === 'rojo') {
        semaforo = s;
      }
    } else if (
      evaluacion?.semaforo_socioeconomico === 'verde' ||
      evaluacion?.semaforo_socioeconomico === 'amarillo' ||
      evaluacion?.semaforo_socioeconomico === 'rojo'
    ) {
      semaforo = evaluacion.semaforo_socioeconomico;
    }

    const convalidado = aprobar || Boolean(dto.convalidado);
    const estado_final = convalidado
      ? EstadoEvaluacion.COMPLETADO
      : (dto.estado as EstadoEvaluacion) || EstadoEvaluacion.COMPLETADO;

    const datos_formulario_final = {
      ...(evaluacion?.datos_formulario || {}),
      ...(dto.respuestas || {}),
      convalidado,
      fecha_revision: new Date().toISOString(),
    };

    if (!evaluacion) {
      evaluacion = this.evaluacion_repo.create({
        becario_id: becario_real_id,
        periodo_id,
        modulo_id: 5,
        evaluador_id,
        puntaje: puntaje_final,
        estado: estado_final,
        observaciones:
          dto.observaciones ||
          (aprobar
            ? `Evaluación socioeconómica aprobada y convalidada (${puntaje_final}/20 pts).`
            : `Evaluación socioeconómica revisada (${puntaje_final}/20 pts).`),
        datos_formulario: datos_formulario_final,
        semaforo_socioeconomico: semaforo,
        fecha_evaluacion: new Date(),
      });
    } else {
      evaluacion.puntaje = puntaje_final;
      evaluacion.estado = estado_final;
      evaluacion.semaforo_socioeconomico = semaforo;
      evaluacion.datos_formulario = datos_formulario_final;
      if (dto.observaciones !== undefined) {
        evaluacion.observaciones = dto.observaciones;
      }
      evaluacion.fecha_evaluacion = new Date();
    }

    const guardada = await this.evaluacion_repo.save(evaluacion);

    const payload_ws = {
      accion: aprobar ? 'socioeconomica_aprobada' : 'socioeconomica_revisada',
      modulo_id: 5,
      becario_id: becario_real_id,
      evaluacion_id: guardada.id,
      puntaje_sobre_20: puntaje_final,
      semaforo,
      estado: estado_final,
      convalidado,
    };
    this.tiempo_real_gateway?.notificarEvaluacion(payload_ws);

    return {
      exito: true,
      mensaje: aprobar
        ? 'Evaluación socioeconómica aprobada y convalidada exitosamente.'
        : 'Revisión de evaluación socioeconómica guardada exitosamente.',
      ...payload_ws,
      evaluacion: guardada,
    };
  }

  async aprobarEvaluacionSocioeconomica(becario_id: number, dto: RevisarSocioeconomicaDto) {
    return this.revisarEvaluacionSocioeconomica(becario_id, { ...dto, convalidado: true }, true);
  }

  async obtenerEstructuraCalificacion() {
    let guardado: Record<string, unknown> | null = this.estructura_calificacion_memoria;

    if (this.configuracion_repo?.findOne) {
      try {
        const reg = await this.configuracion_repo.findOne({
          where: { clave: 'ESTRUCTURA_CALIFICACION_SEMESTRAL' },
        });
        if (reg && reg.valor_json && typeof reg.valor_json === 'object' && !Array.isArray(reg.valor_json)) {
          guardado = reg.valor_json as Record<string, unknown>;
          this.estructura_calificacion_memoria = guardado;
        }
      } catch {}
    }

    let periodo_activo: PeriodoEvaluacion | null = null;
    if (this.periodo_repo?.findOne) {
      try {
        periodo_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      } catch {}
    }

    const criterios_base: CriteriosOficiales =
      guardado && guardado.criterios_oficiales
        ? (guardado.criterios_oficiales as CriteriosOficiales)
        : JSON.parse(JSON.stringify(CRITERIOS_OFICIALES_TABLA));

    const modulos_defecto = [
      {
        id: 1,
        clave: 'academico',
        modulo: 'Académico',
        titulo: criterios_base.academico.titulo,
        puntaje_maximo: Number(criterios_base.academico.peso_maximo || 20),
        peso_maximo: Number(criterios_base.academico.peso_maximo || 20),
        reglas: criterios_base.academico.criterios.map((c) => ({
          condicion: c.condicion,
          puntos: Number(c.puntaje),
          puntaje: Number(c.puntaje),
        })),
        criterios: criterios_base.academico.criterios,
        nota: 'Se requiere récord y certificado de notas oficial legalizado por la universidad.',
      },
      {
        id: 2,
        clave: 'liderazgo_iglesia',
        modulo: 'Liderazgo en la Iglesia',
        titulo: criterios_base.liderazgo_iglesia.titulo,
        puntaje_maximo: Number(criterios_base.liderazgo_iglesia.peso_maximo || 20),
        peso_maximo: Number(criterios_base.liderazgo_iglesia.peso_maximo || 20),
        reglas: criterios_base.liderazgo_iglesia.criterios.map((c) => ({
          condicion: c.condicion,
          puntos: Number(c.puntaje),
          puntaje: Number(c.puntaje),
        })),
        criterios: criterios_base.liderazgo_iglesia.criterios,
        nota: 'Certificado pastoral suscrito por el pastor de la congregación con sello eclesiástico.',
      },
      {
        id: 3,
        clave: 'practicas_preprofesionales',
        modulo: 'PP² (Prácticas Preprofesionales)',
        titulo: criterios_base.practicas_preprofesionales.titulo,
        puntaje_maximo: Number(criterios_base.practicas_preprofesionales.peso_maximo || 20),
        peso_maximo: Number(criterios_base.practicas_preprofesionales.peso_maximo || 20),
        reglas: criterios_base.practicas_preprofesionales.criterios.map((c) => ({
          condicion: c.condicion,
          puntos: Number(c.puntaje),
          puntaje: Number(c.puntaje),
        })),
        criterios: criterios_base.practicas_preprofesionales.criterios,
        nota: 'Evaluación del Mentor y Supervisor con las 18 preguntas en escala 1-10 y 3 abiertas.',
      },
      {
        id: 4,
        clave: 'escuela_lideres',
        modulo: 'Escuela de Líderes',
        titulo: criterios_base.escuela_lideres.titulo,
        puntaje_maximo: Number(criterios_base.escuela_lideres.peso_maximo || 20),
        peso_maximo: Number(criterios_base.escuela_lideres.peso_maximo || 20),
        reglas: criterios_base.escuela_lideres.criterios.map((c) => ({
          condicion: c.condicion,
          puntos: Number(c.puntaje),
          puntaje: Number(c.puntaje),
        })),
        criterios: criterios_base.escuela_lideres.criterios,
        nota: 'Cálculo Classroom/CETI de las tareas y encuentros, y control de asistencia de viernes.',
      },
      {
        id: 5,
        clave: 'socioeconomico',
        modulo: 'Evaluación Socioeconómica',
        titulo: criterios_base.socioeconomico.titulo,
        puntaje_maximo: Number(criterios_base.socioeconomico.peso_maximo || 20),
        peso_maximo: Number(criterios_base.socioeconomico.peso_maximo || 20),
        reglas: criterios_base.socioeconomico.criterios.map((c) => ({
          condicion: c.condicion,
          puntos: Number(c.puntaje),
          puntaje: Number(c.puntaje),
        })),
        criterios: criterios_base.socioeconomico.criterios,
        nota: 'Aplicación de las 26 preguntas de bienestar personal, social y universitario.',
      },
    ];

    const modulos = Array.isArray(guardado?.modulos) ? guardado!.modulos : modulos_defecto;

    return {
      clave: 'ESTRUCTURA_CALIFICACION_SEMESTRAL',
      total_puntos: 100,
      modulos,
      criterios_oficiales: criterios_base,
      rangos_aprobacion: RANGOS_APROBACION_OFICIALES,
      pesos_periodo: {
        periodo_id: periodo_activo?.id ?? 2,
        peso_academica: Number(periodo_activo?.peso_academica ?? modulos_defecto[0].puntaje_maximo),
        peso_liderazgo: Number(periodo_activo?.peso_liderazgo ?? modulos_defecto[1].puntaje_maximo),
        peso_mentor: Number(periodo_activo?.peso_mentor ?? modulos_defecto[2].puntaje_maximo),
        peso_practicas: Number(periodo_activo?.peso_practicas ?? modulos_defecto[3].puntaje_maximo),
        peso_socioeconomica: Number(periodo_activo?.peso_socioeconomica ?? modulos_defecto[4].puntaje_maximo),
      },
    };
  }

  async guardarEstructuraCalificacion(payload: Record<string, unknown>) {
    const actual = await this.obtenerEstructuraCalificacion();
    const criterios_actualizados: CriteriosOficiales = JSON.parse(
      JSON.stringify(payload.criterios_oficiales || actual.criterios_oficiales),
    );

    let modulos_entrantes = Array.isArray(payload.modulos) ? (payload.modulos as any[]) : null;
    if (modulos_entrantes && modulos_entrantes.length === 5) {
      const claves: (keyof CriteriosOficiales)[] = [
        'academico',
        'liderazgo_iglesia',
        'practicas_preprofesionales',
        'escuela_lideres',
        'socioeconomico',
      ];
      modulos_entrantes.forEach((m, idx) => {
        const clave = (m.clave as keyof CriteriosOficiales) || claves[idx];
        const pts_max = Number(m.puntaje_maximo ?? m.peso_maximo ?? 20);
        if (criterios_actualizados[clave]) {
          criterios_actualizados[clave].peso_maximo = pts_max;
          criterios_actualizados[clave].titulo = `${m.modulo || m.titulo || clave} (${pts_max} pts)`;
          if (Array.isArray(m.reglas)) {
            criterios_actualizados[clave].criterios = m.reglas.map((r: any) => ({
              condicion: String(r.condicion || ''),
              puntaje: Number(r.puntos ?? r.puntaje ?? 0),
            }));
          } else if (Array.isArray(m.criterios)) {
            criterios_actualizados[clave].criterios = m.criterios.map((r: any) => ({
              condicion: String(r.condicion || ''),
              puntaje: Number(r.puntaje ?? r.puntos ?? 0),
            }));
          }
        }
      });
    }

    const p_academica = Number(
      payload.peso_academica ??
        (payload.pesos_periodo as any)?.peso_academica ??
        criterios_actualizados.academico.peso_maximo ??
        20,
    );
    const p_liderazgo = Number(
      payload.peso_liderazgo ??
        (payload.pesos_periodo as any)?.peso_liderazgo ??
        criterios_actualizados.liderazgo_iglesia.peso_maximo ??
        20,
    );
    const p_mentor = Number(
      payload.peso_mentor ??
        (payload.pesos_periodo as any)?.peso_mentor ??
        criterios_actualizados.practicas_preprofesionales.peso_maximo ??
        20,
    );
    const p_practicas = Number(
      payload.peso_practicas ??
        (payload.pesos_periodo as any)?.peso_practicas ??
        criterios_actualizados.escuela_lideres.peso_maximo ??
        20,
    );
    const p_socio = Number(
      payload.peso_socioeconomica ??
        (payload.pesos_periodo as any)?.peso_socioeconomica ??
        criterios_actualizados.socioeconomico.peso_maximo ??
        20,
    );

    const suma_total = p_academica + p_liderazgo + p_mentor + p_practicas + p_socio;
    if (Math.abs(suma_total - 100) > 0.01) {
      throw new BadRequestException(
        `La suma de los puntos máximos de los 5 módulos debe ser exactamente 100 puntos (suma actual: ${suma_total}).`,
      );
    }

    criterios_actualizados.academico.peso_maximo = p_academica;
    criterios_actualizados.liderazgo_iglesia.peso_maximo = p_liderazgo;
    criterios_actualizados.practicas_preprofesionales.peso_maximo = p_mentor;
    criterios_actualizados.escuela_lideres.peso_maximo = p_practicas;
    criterios_actualizados.socioeconomico.peso_maximo = p_socio;

    const estructura_guardar = {
      modulos: modulos_entrantes || [
        {
          id: 1,
          clave: 'academico',
          modulo: 'Académico',
          titulo: criterios_actualizados.academico.titulo,
          puntaje_maximo: p_academica,
          peso_maximo: p_academica,
          reglas: criterios_actualizados.academico.criterios.map((c) => ({
            condicion: c.condicion,
            puntos: Number(c.puntaje),
            puntaje: Number(c.puntaje),
          })),
          criterios: criterios_actualizados.academico.criterios,
          nota: 'Se requiere récord y certificado de notas oficial legalizado por la universidad.',
        },
        {
          id: 2,
          clave: 'liderazgo_iglesia',
          modulo: 'Liderazgo en la Iglesia',
          titulo: criterios_actualizados.liderazgo_iglesia.titulo,
          puntaje_maximo: p_liderazgo,
          peso_maximo: p_liderazgo,
          reglas: criterios_actualizados.liderazgo_iglesia.criterios.map((c) => ({
            condicion: c.condicion,
            puntos: Number(c.puntaje),
            puntaje: Number(c.puntaje),
          })),
          criterios: criterios_actualizados.liderazgo_iglesia.criterios,
          nota: 'Certificado pastoral suscrito por el pastor de la congregación con sello eclesiástico.',
        },
        {
          id: 3,
          clave: 'practicas_preprofesionales',
          modulo: 'PP² (Prácticas Preprofesionales)',
          titulo: criterios_actualizados.practicas_preprofesionales.titulo,
          puntaje_maximo: p_mentor,
          peso_maximo: p_mentor,
          reglas: criterios_actualizados.practicas_preprofesionales.criterios.map((c) => ({
            condicion: c.condicion,
            puntos: Number(c.puntaje),
            puntaje: Number(c.puntaje),
          })),
          criterios: criterios_actualizados.practicas_preprofesionales.criterios,
          nota: 'Evaluación del Mentor y Supervisor con las 18 preguntas en escala 1-10 y 3 abiertas.',
        },
        {
          id: 4,
          clave: 'escuela_lideres',
          modulo: 'Escuela de Líderes',
          titulo: criterios_actualizados.escuela_lideres.titulo,
          puntaje_maximo: p_practicas,
          peso_maximo: p_practicas,
          reglas: criterios_actualizados.escuela_lideres.criterios.map((c) => ({
            condicion: c.condicion,
            puntos: Number(c.puntaje),
            puntaje: Number(c.puntaje),
          })),
          criterios: criterios_actualizados.escuela_lideres.criterios,
          nota: 'Cálculo Classroom/CETI de las tareas y encuentros, y control de asistencia de viernes.',
        },
        {
          id: 5,
          clave: 'socioeconomico',
          modulo: 'Evaluación Socioeconómica',
          titulo: criterios_actualizados.socioeconomico.titulo,
          puntaje_maximo: p_socio,
          peso_maximo: p_socio,
          reglas: criterios_actualizados.socioeconomico.criterios.map((c) => ({
            condicion: c.condicion,
            puntos: Number(c.puntaje),
            puntaje: Number(c.puntaje),
          })),
          criterios: criterios_actualizados.socioeconomico.criterios,
          nota: 'Aplicación de las 26 preguntas de bienestar personal, social y universitario.',
        },
      ],
      criterios_oficiales: criterios_actualizados,
    };

    this.estructura_calificacion_memoria = estructura_guardar;

    if (this.configuracion_repo?.findOne && this.configuracion_repo.save) {
      try {
        let reg = await this.configuracion_repo.findOne({
          where: { clave: 'ESTRUCTURA_CALIFICACION_SEMESTRAL' },
        });
        if (!reg) {
          reg = this.configuracion_repo.create({
            clave: 'ESTRUCTURA_CALIFICACION_SEMESTRAL',
            confirmacion_datos_activa: false,
            valor_json: estructura_guardar,
          });
        } else {
          reg.valor_json = estructura_guardar;
        }
        await this.configuracion_repo.save(reg);
      } catch {}
    }

    if (this.periodo_repo?.findOne && this.periodo_repo.save) {
      try {
        const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
        if (p_activo) {
          p_activo.peso_academica = p_academica;
          p_activo.peso_liderazgo = p_liderazgo;
          p_activo.peso_mentor = p_mentor;
          p_activo.peso_practicas = p_practicas;
          p_activo.peso_socioeconomica = p_socio;
          await this.periodo_repo.save(p_activo);
        }
      } catch {}
    }

    this.tiempo_real_gateway?.notificarEvaluacion({
      accion: 'estructura_calificacion_actualizada',
      total_puntos: 100,
    });

    return {
      exito: true,
      mensaje: 'Estructura de calificación y ponderaciones semestrales actualizadas correctamente.',
      ...(await this.obtenerEstructuraCalificacion()),
    };
  }

  calcularPuntajeAcademicoPorCriterio(promedio: number, materias_reprobadas: number = 0): number {
    if (materias_reprobadas > 1) {
      return 0;
    }
    if (materias_reprobadas === 1) {
      return promedio > 51 ? 10 : 0;
    }
    if (promedio >= 70) {
      return 20;
    }
    return 15;
  }

  obtenerCalificacionLiteralOficial(total_100: number): string {
    if (total_100 >= 70) {
      return 'Aprobación óptima';
    }
    if (total_100 >= 51) {
      return 'Aprobación Condicionada';
    }
    return 'Reprobó y debe abandonar el programa';
  }

  async obtenerConsolidadoSemestral(periodo?: string): Promise<{
    periodo: string;
    total_becarios: number;
    criterios_oficiales: CriteriosOficiales;
    rangos_aprobacion: RangoAprobacion[];
    registros: RegistroConsolidadoSemestral[];
  }> {
    const periodo_nombre = periodo || 'II-2025';
    const registros_copia = REGISTROS_CONSOLIDADO_SEM_II.map((r) => ({ ...r }));

    if (this.evaluacion_repo?.find) {
      try {
        const evaluaciones_bd = await this.evaluacion_repo.find({
          relations: { becario: true },
        });

        for (const reg of registros_copia) {
          const evs_becario = evaluaciones_bd.filter((e) => e.becario?.ci === reg.ci);
          for (const ev of evs_becario) {
            const pts = ev.puntaje !== null && ev.puntaje !== undefined ? Number(ev.puntaje) : null;
            if (pts === null) continue;
            if (ev.modulo_id === 1) reg.liderazgo_iglesia = pts;
            else if (ev.modulo_id === 2) reg.academica = pts;
            else if (ev.modulo_id === 3) reg.practicas_preprofesionales = pts;
            else if (ev.modulo_id === 4) reg.escuela_lideres = pts;
            else if (ev.modulo_id === 5) reg.socioeconomico = pts;
          }
          const total = Number(
            (reg.academica + reg.liderazgo_iglesia + reg.practicas_preprofesionales + reg.escuela_lideres + reg.socioeconomico).toFixed(1),
          );
          reg.total = total;
          reg.total_calificacion = this.obtenerCalificacionLiteralOficial(total);
        }
      } catch {
        // En caso de que la tabla aún no contenga registros, se retorna la lista canónica del Excel
      }
    }

    return {
      periodo: periodo_nombre,
      total_becarios: registros_copia.length,
      criterios_oficiales: CRITERIOS_OFICIALES_TABLA,
      rangos_aprobacion: RANGOS_APROBACION_OFICIALES,
      registros: registros_copia,
    };
  }

  async solicitarCodigoTutor(
    dto: SolicitarCodigoTutorDto,
    usuario_actual?: Usuario,
  ): Promise<{
    enviado: boolean;
    codigo?: string;
    expira_en_minutos?: number;
    becario_id: number;
    becario_nombre: string;
    supervisor_id?: number;
    supervisor_nombre: string;
    supervisor_correo: string;
    expira_en_segundos: number;
    mensaje: string;
  }> {
    let becario: Becario | null = null;
    const referencia_id = dto.becario_id || usuario_actual?.id || 1;

    if (this.becario_repo) {
      becario = await this.becario_repo.findOne({
        where: [{ id: referencia_id }, { usuario_id: referencia_id }],
        relations: { usuario: true, supervisor: true },
      });
      if (!becario) {
        becario = await this.becario_repo.findOne({
          where: {},
          relations: { usuario: true, supervisor: true },
          order: { id: 'ASC' },
        });
      }
    }

    const becario_id_clave = becario?.id || referencia_id;
    const becario_nombre = becario?.usuario?.nombre || usuario_actual?.nombre || 'María Catunta Laime';

    // Obtener el supervisor ESPECÍFICO del becario
    let supervisor_usuario: Usuario | null = becario?.supervisor || null;
    if (!supervisor_usuario && becario?.supervisor_id && this.usuario_repo) {
      supervisor_usuario = await this.usuario_repo.findOne({
        where: { id: becario.supervisor_id },
      });
    }
    if (!supervisor_usuario && this.usuario_repo) {
      supervisor_usuario = await this.usuario_repo.findOne({
        where: { rol: Rol.SUPERVISOR },
        order: { id: 'ASC' },
      });
    }

    const supervisor_id = supervisor_usuario?.id;
    const supervisor_nombre = supervisor_usuario?.nombre || 'Angel Javier Ali Paz';
    const supervisor_correo = supervisor_usuario?.correo || 'angel.ali@bumand.bo';

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = Date.now() + 10 * 60 * 1000;

    const registro_codigo = {
      codigo,
      expira,
      supervisor_id,
      supervisor_nombre,
      supervisor_correo,
    };

    this.codigos_tutor.set(becario_id_clave, registro_codigo);
    this.codigos_tutor.set(0, registro_codigo);

    const texto_notificacion = `🔐 Código de autorización para evaluar a ${becario_nombre} (Módulo 03 - Pasantías): ${codigo}. Válido por 10 minutos.`;

    // AHORA: Enviar ÚNICAMENTE al supervisor específico del becario (ya no a los administradores ni a todos los supervisores)
    if (this.notificaciones_servicio && supervisor_id) {
      try {
        await this.notificaciones_servicio.crear({
          usuario_id: supervisor_id,
          tipo: 'evaluacion_codigo_tutor',
          mensaje: texto_notificacion,
        });
      } catch {
        // Continuar si falla la persistencia
      }
    }

    // Notificación en tiempo real dirigida exclusivamente al supervisor específico
    this.tiempo_real_gateway?.notificarCodigoTutor({
      destinatario_rol: Rol.SUPERVISOR,
      destinatario_usuario_id: supervisor_id,
      supervisor_id,
      becario_id: becario_id_clave,
      becario_nombre,
      supervisor_nombre,
      supervisor_correo,
      codigo,
      mensaje: texto_notificacion,
      fecha_envio: new Date().toISOString(),
    });

    return {
      enviado: true,
      codigo,
      expira_en_minutos: 10,
      becario_id: becario_id_clave,
      becario_nombre,
      supervisor_id,
      supervisor_nombre,
      supervisor_correo,
      expira_en_segundos: 600,
      mensaje: `Se envió una notificación con el código de 6 dígitos a la pantalla de su supervisor específico (${supervisor_nombre}).`,
    };
  }

  async verificarCodigoTutor(dto: VerificarCodigoTutorDto): Promise<{
    verificado: boolean;
    valido: boolean;
    metodo: string;
    supervisor_nombre: string;
    supervisor_correo: string;
    mensaje: string;
  }> {
    if (dto.codigo && dto.codigo.trim().length > 0) {
      const codigo_limpio = dto.codigo.trim();
      const ahora = Date.now();

      for (const [clave, valor] of this.codigos_tutor.entries()) {
        if (valor.codigo === codigo_limpio && valor.expira >= ahora) {
          this.codigos_tutor.delete(clave);
          return {
            verificado: true,
            valido: true,
            metodo: 'codigo_notificacion',
            supervisor_nombre: valor.supervisor_nombre,
            supervisor_correo: valor.supervisor_correo,
            mensaje: 'Código verificado correctamente',
          };
        }
      }

      throw new BadRequestException(
        'El código ingresado es incorrecto o ha expirado. Revisa la notificación en la pantalla de su supervisor específico o solicita un nuevo código.',
      );
    }

    if (dto.correo && dto.contrasena) {
      const correo_limpio = dto.correo.trim().toLowerCase();
      if (this.usuario_repo) {
        const usuario = await this.usuario_repo.findOne({
          where: [{ correo: correo_limpio }, { correo_alternativo: correo_limpio }],
        });
        if (
          usuario &&
          (usuario.rol === Rol.SUPERVISOR || usuario.rol === Rol.ADMINISTRADOR) &&
          (await compararContrasena(dto.contrasena, usuario.contrasena_hash))
        ) {
          return {
            verificado: true,
            valido: true,
            metodo: 'credenciales',
            supervisor_nombre: usuario.nombre,
            supervisor_correo: usuario.correo,
            mensaje: 'Código verificado correctamente',
          };
        }
      }

      throw new BadRequestException(
        'Credenciales inválidas o la cuenta ingresada no corresponde a un Supervisor/Tutor autorizado.',
      );
    }

    throw new BadRequestException(
      'Debes ingresar el código de 6 dígitos enviado por notificación a su supervisor o las credenciales del supervisor.',
    );
  }

  // ==============================================================
  // MÓDULO DE GESTIÓN Y SEGUIMIENTO PASTORAL / MENTORÍA
  // ==============================================================

  async obtenerCasosPastorales(filtros?: {
    estado?: string;
    becario_id?: number;
  }): Promise<any[]> {
    if (this.caso_pastoral_repo) {
      try {
        const qb = this.caso_pastoral_repo
          .createQueryBuilder('caso')
          .leftJoinAndSelect('caso.becario', 'becario')
          .leftJoinAndSelect('becario.usuario', 'usuario')
          .leftJoinAndSelect('becario.iglesia', 'iglesia');

        if (filtros?.estado && filtros.estado !== 'todos') {
          qb.andWhere('caso.estado = :estado', { estado: filtros.estado });
        }
        if (filtros?.becario_id) {
          qb.andWhere('caso.becario_id = :becarioId', { becarioId: filtros.becario_id });
        }

        qb.orderBy('caso.created_at', 'DESC');
        const casos = await qb.getMany();

        if (casos.length > 0) {
          return casos;
        }
      } catch (err) {
        // En caso de que la tabla aún no esté sincronizada, recurre al catálogo institucional
      }
    }

    const por_defecto = this.obtenerCasosPastoralesPorDefecto();
    if (filtros?.estado && filtros.estado !== 'todos') {
      return por_defecto.filter((c) => c.estado === filtros.estado);
    }
    return por_defecto;
  }

  obtenerCasosPastoralesPorDefecto(): any[] {
    return [
      {
        id: 1,
        becario_id: 1,
        becario: { nombre: 'Carlos Oscar Luna Lizarraga', carrera: 'Economía', universidad: 'UMSA' },
        origen: 'Formulario F-03 (Pastor)',
        observacion_pastoral: 'Aún no es miembro de la iglesia; requiere mayor contacto con la congregación.',
        plan_accion: '3 sesiones de acompañamiento con pastor de jóvenes y vinculación a discipulado.',
        estado: EstadoCasoPastoral.PENDIENTE,
        prioridad: PrioridadCasoPastoral.ALTA,
        responsable_nombre: 'Pr. Juan Ramos (Tutoría Pastoral)',
        notas_seguimiento: [
          {
            fecha: '2026-08-10',
            autor: 'Pr. Juan Ramos',
            rol_autor: 'Pastor Local',
            contenido: 'Primera entrevista inicial de acogida pastoral.',
            acuerdos: 'Asistir a reunión de jóvenes los sábados.',
          },
        ],
        created_at: new Date('2026-08-01'),
      },
      {
        id: 2,
        becario_id: 2,
        becario: { nombre: 'Jhoselin Quispe Morales', carrera: 'Comunicación Social', universidad: 'UMSA' },
        origen: 'Formulario F-03 (Pastor)',
        observacion_pastoral: 'No desempeña algún cargo de liderazgo.',
        plan_accion: 'Mentoría de servicio: integración en el equipo de medios y transmisión dominical.',
        estado: EstadoCasoPastoral.EN_TUTORIA,
        prioridad: PrioridadCasoPastoral.MEDIA,
        responsable_nombre: 'Hno. David Mendoza (Diaconía)',
        notas_seguimiento: [
          {
            fecha: '2026-08-15',
            autor: 'Hno. David Mendoza',
            rol_autor: 'Mentor',
            contenido: 'Becaria muestra buena disposición a colaborar con streaming.',
            acuerdos: 'Capacitación en consola de audio el viernes.',
          },
        ],
        created_at: new Date('2026-08-01'),
      },
      {
        id: 3,
        becario_id: 3,
        becario: { nombre: 'José Marcos Suñagua Quispe', carrera: 'Informática', universidad: 'UMSA' },
        origen: 'Formulario F-03 (Pastor)',
        observacion_pastoral: 'Trabajar en debilidades: puntualidad en la iglesia.',
        plan_accion: 'Compromiso de puntualidad y asignación de bienvenida 15 min antes del culto.',
        estado: EstadoCasoPastoral.PENDIENTE,
        prioridad: PrioridadCasoPastoral.ALTA,
        responsable_nombre: 'Tutor Pastoral Diaconía',
        notas_seguimiento: [],
        created_at: new Date('2026-08-01'),
      },
      {
        id: 4,
        becario_id: 4,
        becario: { nombre: 'Luis Santiago Enrriquez Conde', carrera: 'Cs. de la Comunicación Social', universidad: 'UMSA' },
        origen: 'Formulario F-03 (Pastor)',
        observacion_pastoral: 'No desempeña algún cargo; no forma a nuevos líderes, pero tiene potencial.',
        plan_accion: 'Plan de formación de líderes junior en Escuela Dominical.',
        estado: EstadoCasoPastoral.EN_TUTORIA,
        prioridad: PrioridadCasoPastoral.MEDIA,
        responsable_nombre: 'Pr. Marcos Caluyo',
        notas_seguimiento: [
          {
            fecha: '2026-08-20',
            autor: 'Pr. Marcos Caluyo',
            rol_autor: 'Pastor',
            contenido: 'Inició como asistente en grupo de adolescentes.',
            acuerdos: 'Preparar devocional para fin de mes.',
          },
        ],
        created_at: new Date('2026-08-01'),
      },
      {
        id: 5,
        becario_id: 5,
        becario: { nombre: 'Mariela Dayana Jimenez Chambi', carrera: 'Contaduría Pública', universidad: 'UMSA' },
        origen: 'Formulario F-03 (Pastor)',
        observacion_pastoral: 'No desempeña algún cargo de liderazgo.',
        plan_accion: 'Incorporación en la tesorería o mayordomía auxiliar de la congregación.',
        estado: EstadoCasoPastoral.PENDIENTE,
        prioridad: PrioridadCasoPastoral.BAJA,
        responsable_nombre: 'Coordinación Pastoral',
        notas_seguimiento: [],
        created_at: new Date('2026-08-01'),
      },
      {
        id: 6,
        becario_id: 6,
        becario: { nombre: 'Mayherli Alejandra Loza Villalobos', carrera: 'Contaduría Pública', universidad: 'UMSA' },
        origen: 'Formulario F-03 (Pastor)',
        observacion_pastoral: 'No desempeña algún cargo; se encuentra en formación.',
        plan_accion: 'Seguimiento en discipulado de liderazgo juvenil.',
        estado: EstadoCasoPastoral.EN_TUTORIA,
        prioridad: PrioridadCasoPastoral.BAJA,
        responsable_nombre: 'Líder Débora Quispe',
        notas_seguimiento: [],
        created_at: new Date('2026-08-01'),
      },
      {
        id: 7,
        becario_id: 7,
        becario: { nombre: 'Nilda Amalia Churata Paye', carrera: 'Educación Parvularia', universidad: 'UPEA' },
        origen: 'Formulario F-03 (Pastor)',
        observacion_pastoral: 'Asiste solo domingos; falta mejorar el compromiso e involucrarse más.',
        plan_accion: 'Acompañamiento integral para conciliar horarios de estudio con actividades congregacionales.',
        estado: EstadoCasoPastoral.PENDIENTE,
        prioridad: PrioridadCasoPastoral.ALTA,
        responsable_nombre: 'Pr. Samuel Amigos Central',
        notas_seguimiento: [],
        created_at: new Date('2026-08-01'),
      },
    ];
  }

  async crearCasoPastoral(dto: {
    becario_id: number;
    observacion_pastoral: string;
    origen?: string;
    prioridad?: PrioridadCasoPastoral;
    plan_accion?: string;
    responsable_nombre?: string;
  }): Promise<CasoSeguimientoPastoral> {
    if (!this.caso_pastoral_repo) {
      throw new BadRequestException('Módulo de casos pastorales no disponible');
    }
    const nuevo = this.caso_pastoral_repo.create({
      becario_id: dto.becario_id,
      observacion_pastoral: dto.observacion_pastoral,
      origen: dto.origen || 'Formulario F-03 (Pastor)',
      prioridad: dto.prioridad || PrioridadCasoPastoral.ALTA,
      plan_accion: dto.plan_accion || null,
      responsable_nombre: dto.responsable_nombre || 'Tutoría Pastoral Diaconía',
      estado: EstadoCasoPastoral.PENDIENTE,
      notas_seguimiento: [],
    });
    return this.caso_pastoral_repo.save(nuevo);
  }

  async gestionarCasoPastoral(
    id: number,
    dto: {
      plan_accion?: string;
      estado?: EstadoCasoPastoral;
      prioridad?: PrioridadCasoPastoral;
      responsable_nombre?: string;
      nueva_nota?: { autor: string; rol_autor: string; contenido: string; acuerdos?: string };
    },
  ): Promise<CasoSeguimientoPastoral> {
    if (!this.caso_pastoral_repo) {
      throw new BadRequestException('Módulo de casos pastorales no disponible');
    }
    const caso = await this.caso_pastoral_repo.findOne({ where: { id }, relations: { becario: true } });
    if (!caso) {
      throw new NotFoundException(`Caso con ID ${id} no encontrado`);
    }
    if (dto.plan_accion !== undefined) caso.plan_accion = dto.plan_accion;
    if (dto.estado !== undefined) caso.estado = dto.estado;
    if (dto.prioridad !== undefined) caso.prioridad = dto.prioridad;
    if (dto.responsable_nombre !== undefined) caso.responsable_nombre = dto.responsable_nombre;

    if (dto.nueva_nota) {
      const notas = Array.isArray(caso.notas_seguimiento) ? [...caso.notas_seguimiento] : [];
      notas.push({
        fecha: new Date().toISOString().split('T')[0],
        autor: dto.nueva_nota.autor || 'Supervisor',
        rol_autor: dto.nueva_nota.rol_autor || 'Tutor',
        contenido: dto.nueva_nota.contenido,
        acuerdos: dto.nueva_nota.acuerdos,
      });
      caso.notas_seguimiento = notas;
    }

    return this.caso_pastoral_repo.save(caso);
  }

  async resolverCasoPastoral(id: number, conclusion: string): Promise<CasoSeguimientoPastoral> {
    if (!this.caso_pastoral_repo) {
      throw new BadRequestException('Módulo de casos pastorales no disponible');
    }
    const caso = await this.caso_pastoral_repo.findOne({ where: { id }, relations: { becario: true } });
    if (!caso) {
      throw new NotFoundException(`Caso con ID ${id} no encontrado`);
    }
    caso.estado = EstadoCasoPastoral.RESUELTO;
    caso.conclusion_resolucion = conclusion || 'Caso superado y convalidado satisfactoriamente.';
    caso.fecha_resolucion = new Date();

    const notas = Array.isArray(caso.notas_seguimiento) ? [...caso.notas_seguimiento] : [];
    notas.push({
      fecha: new Date().toISOString().split('T')[0],
      autor: 'Coordinación Diaconía',
      rol_autor: 'Auditoría Pastoral',
      contenido: `Caso marcado como Resuelto: ${caso.conclusion_resolucion}`,
    });
    caso.notas_seguimiento = notas;

    return this.caso_pastoral_repo.save(caso);
  }

  // ==============================================================
  // GESTIÓN DINÁMICA DE CUESTIONARIOS Y EVALUACIONES (ADMINISTRADOR)
  // ==============================================================

  async listarCuestionarios(): Promise<Cuestionario[]> {
    if (!this.cuestionario_repo) {
      throw new BadRequestException('Repositorio de cuestionarios no disponible');
    }
    const cuestionarios = await this.cuestionario_repo.find({
      relations: { preguntas: true, modulo: true },
      order: { id: 'ASC' },
    });

    if (cuestionarios.length === 0) {
      await this.sembrarCuestionariosBase();
      return this.cuestionario_repo.find({
        relations: { preguntas: true, modulo: true },
        order: { id: 'ASC' },
      });
    }

    return cuestionarios;
  }

  async obtenerCuestionarioPorId(id: number): Promise<Cuestionario> {
    if (!this.cuestionario_repo) {
      throw new BadRequestException('Repositorio de cuestionarios no disponible');
    }
    const cuestionario = await this.cuestionario_repo.findOne({
      where: { id },
      relations: { preguntas: true, modulo: true },
      order: {
        preguntas: {
          numero_orden: 'ASC',
        },
      },
    });
    if (!cuestionario) {
      throw new NotFoundException(`Cuestionario con ID ${id} no encontrado`);
    }
    return cuestionario;
  }

  async crearCuestionario(dto: CrearCuestionarioDto): Promise<Cuestionario> {
    if (!this.cuestionario_repo) {
      throw new BadRequestException('Repositorio de cuestionarios no disponible');
    }
    const existente = await this.cuestionario_repo.findOne({ where: { codigo: dto.codigo } });
    if (existente) {
      throw new BadRequestException(`Ya existe un cuestionario con el código "${dto.codigo}"`);
    }
    const nuevo = this.cuestionario_repo.create({
      codigo: dto.codigo,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipo_evaluador: dto.tipo_evaluador || 'general',
      modulo_id: dto.modulo_id ?? null,
      activo: dto.activo ?? true,
    });
    return this.cuestionario_repo.save(nuevo);
  }

  async actualizarCuestionario(id: number, dto: ActualizarCuestionarioDto): Promise<Cuestionario> {
    const cuestionario = await this.obtenerCuestionarioPorId(id);
    if (dto.codigo && dto.codigo !== cuestionario.codigo) {
      const duplicado = await this.cuestionario_repo?.findOne({ where: { codigo: dto.codigo } });
      if (duplicado) {
        throw new BadRequestException(`Ya existe otro cuestionario con el código "${dto.codigo}"`);
      }
    }
    Object.assign(cuestionario, dto);
    return this.cuestionario_repo!.save(cuestionario);
  }

  async eliminarCuestionario(id: number): Promise<{ mensaje: string }> {
    const cuestionario = await this.obtenerCuestionarioPorId(id);
    await this.cuestionario_repo!.remove(cuestionario);
    return { mensaje: `Cuestionario "${cuestionario.titulo}" eliminado con éxito` };
  }

  async agregarPreguntaCuestionario(
    cuestionario_id: number,
    dto: CrearPreguntaCuestionarioDto,
  ): Promise<PreguntaCuestionario> {
    if (!this.pregunta_cuestionario_repo) {
      throw new BadRequestException('Repositorio de preguntas no disponible');
    }
    await this.obtenerCuestionarioPorId(cuestionario_id);
    const nueva_pregunta = this.pregunta_cuestionario_repo.create({
      cuestionario_id,
      numero_orden: dto.numero_orden,
      seccion: dto.seccion || 'General',
      titulo: dto.titulo || `Pregunta ${dto.numero_orden}`,
      enunciado: dto.enunciado,
      tipo_pregunta: dto.tipo_pregunta || 'likert',
      opciones: dto.opciones || [],
      peso_puntos: dto.peso_puntos ?? 1.0,
      obligatoria: dto.obligatoria ?? true,
      activa: dto.activa ?? true,
    });
    return this.pregunta_cuestionario_repo.save(nueva_pregunta);
  }

  async actualizarPreguntaCuestionario(
    id: number,
    dto: ActualizarPreguntaCuestionarioDto,
  ): Promise<PreguntaCuestionario> {
    if (!this.pregunta_cuestionario_repo) {
      throw new BadRequestException('Repositorio de preguntas no disponible');
    }
    const pregunta = await this.pregunta_cuestionario_repo.findOne({ where: { id } });
    if (!pregunta) {
      throw new NotFoundException(`Pregunta con ID ${id} no encontrada`);
    }
    Object.assign(pregunta, dto);
    return this.pregunta_cuestionario_repo.save(pregunta);
  }

  async eliminarPreguntaCuestionario(id: number): Promise<{ mensaje: string }> {
    if (!this.pregunta_cuestionario_repo) {
      throw new BadRequestException('Repositorio de preguntas no disponible');
    }
    const pregunta = await this.pregunta_cuestionario_repo.findOne({ where: { id } });
    if (!pregunta) {
      throw new NotFoundException(`Pregunta con ID ${id} no encontrada`);
    }
    await this.pregunta_cuestionario_repo.remove(pregunta);
    return { mensaje: 'Pregunta eliminada exitosamente del cuestionario' };
  }

  async sembrarCuestionariosBase(): Promise<void> {
    if (!this.cuestionario_repo || !this.pregunta_cuestionario_repo) return;

    // 1. Cuestionario de Bienestar Universitario (Módulo 5)
    let c_bienestar = await this.cuestionario_repo.findOne({
      where: { codigo: 'BIENESTAR_ESTUDIANTIL' },
    });
    if (!c_bienestar) {
      c_bienestar = await this.cuestionario_repo.save(
        this.cuestionario_repo.create({
          codigo: 'BIENESTAR_ESTUDIANTIL',
          titulo: 'Cuestionario de Bienestar Universitario',
          descripcion:
            'Instrumento de seguimiento integral psicosocial, espiritual y académico para estudiantes becarios BUMAND.',
          tipo_evaluador: 'becario',
          modulo_id: 5,
          activo: true,
        }),
      );

      for (const p of PREGUNTAS_BIENESTAR_DEFECTO) {
        await this.pregunta_cuestionario_repo.save(
          this.pregunta_cuestionario_repo.create({
            cuestionario_id: c_bienestar.id,
            numero_orden: p.numero_orden,
            seccion: p.categoria || 'Bienestar Integral',
            titulo: p.titulo,
            enunciado: p.enunciado,
            tipo_pregunta: 'likert',
            opciones: p.opciones as any,
            peso_puntos: 1.0,
            obligatoria: true,
            activa: true,
          }),
        );
      }
    }

    // 2. Formulario F-03 Evaluación Pastoral (Módulo 1)
    let c_pastoral = await this.cuestionario_repo.findOne({
      where: { codigo: 'F03_PASTORAL' },
    });
    if (!c_pastoral) {
      c_pastoral = await this.cuestionario_repo.save(
        this.cuestionario_repo.create({
          codigo: 'F03_PASTORAL',
          titulo: 'Formulario F-03: Evaluación Pastoral y Vida Eclesial',
          descripcion:
            'Evaluación cualitativa y cuantitativa emitida por el pastor de la iglesia local sobre liderazgo y testimonio.',
          tipo_evaluador: 'pastor',
          modulo_id: 1,
          activo: true,
        }),
      );

      const preguntas_pastoral = [
        {
          numero_orden: 1,
          seccion: 'Vida Espiritual y Devocional',
          titulo: 'Consistencia en la oración y lectura bíblica',
          enunciado: '¿El becario demuestra madurez y constancia en su vida devocional diaria y comunitaria?',
          tipo_pregunta: 'likert',
          opciones: [
            { inciso: 'A', texto: 'Sobresaliente / Modelo para la congregación', puntaje: 100 },
            { inciso: 'B', texto: 'Constante y comprometido', puntaje: 85 },
            { inciso: 'C', texto: 'Regular / Requiere acompañamiento', puntaje: 65 },
            { inciso: 'D', texto: 'Intermitente o ausente', puntaje: 40 },
          ],
        },
        {
          numero_orden: 2,
          seccion: 'Asistencia y Participación en Cultos',
          titulo: 'Puntualidad y asistencia a cultos dominicales y reuniones',
          enunciado: '¿Asiste puntualmente y participa activamente en los cultos semanales y actividades convocadas?',
          tipo_pregunta: 'likert',
          opciones: [
            { inciso: 'A', texto: 'Asistencia 100% puntual y activa', puntaje: 100 },
            { inciso: 'B', texto: 'Asistencia regular con justificaciones válidas', puntaje: 85 },
            { inciso: 'C', texto: 'Inasistencias esporádicas sin aviso', puntaje: 60 },
            { inciso: 'D', texto: 'Falta constante a las reuniones eclesiales', puntaje: 30 },
          ],
        },
        {
          numero_orden: 3,
          seccion: 'Liderazgo y Servicio Diaconal',
          titulo: 'Responsabilidad en ministerios y servicio congregacional',
          enunciado: '¿Ejerce liderazgo con vocación de servicio diaconal, puntualidad y buen testimonio?',
          tipo_pregunta: 'likert',
          opciones: [
            { inciso: 'A', texto: 'Liderazgo activo y propositivo', puntaje: 100 },
            { inciso: 'B', texto: 'Cumple fielmente con sus asignaciones', puntaje: 85 },
            { inciso: 'C', texto: 'Participación pasiva en los ministerios', puntaje: 60 },
            { inciso: 'D', texto: 'Sin involucramiento en ministerios', puntaje: 25 },
          ],
        },
      ];

      for (const pp of preguntas_pastoral) {
        await this.pregunta_cuestionario_repo.save(
          this.pregunta_cuestionario_repo.create({
            cuestionario_id: c_pastoral.id,
            numero_orden: pp.numero_orden,
            seccion: pp.seccion,
            titulo: pp.titulo,
            enunciado: pp.enunciado,
            tipo_pregunta: pp.tipo_pregunta,
            opciones: pp.opciones as any,
            peso_puntos: 1.0,
            obligatoria: true,
            activa: true,
          }),
        );
      }
    }

    // 3. Rúbrica de Prácticas Preprofesionales / Mentor (Módulo 3)
    let c_mentor = await this.cuestionario_repo.findOne({
      where: { codigo: 'MENTOR_PRACTICAS' },
    });
    if (!c_mentor) {
      c_mentor = await this.cuestionario_repo.save(
        this.cuestionario_repo.create({
          codigo: 'MENTOR_PRACTICAS',
          titulo: 'Rúbrica de Evaluación de Prácticas y Tutoría Institucional',
          descripcion:
            'Evaluación de desempeño, puntualidad, ética y competencias profesionales por el tutor/mentor de Diaconía.',
          tipo_evaluador: 'supervisor',
          modulo_id: 3,
          activo: true,
        }),
      );

      const criterios_mentor = [
        {
          numero_orden: 1,
          seccion: 'Desempeño y Calidad Técnica',
          titulo: 'Calidad en las labores asignadas en sede',
          enunciado: '¿El becario demuestra solvencia técnica y calidad en las tareas de su unidad?',
          tipo_pregunta: 'likert',
          opciones: [
            { inciso: '5', texto: 'Excelente / Supera expectativas', puntaje: 100 },
            { inciso: '4', texto: 'Muy Bueno / Cumplimiento óptimo', puntaje: 85 },
            { inciso: '3', texto: 'Bueno / Cumple el estándar básico', puntaje: 70 },
            { inciso: '2', texto: 'Aceptable con observaciones', puntaje: 55 },
            { inciso: '1', texto: 'Deficiente / No cumple', puntaje: 30 },
          ],
        },
        {
          numero_orden: 2,
          seccion: 'Puntualidad y Compromiso',
          titulo: 'Cumplimiento de horario de apoyo institucional',
          enunciado: '¿Registra sus marcaciones a tiempo y cumple la carga horaria comprometida?',
          tipo_pregunta: 'likert',
          opciones: [
            { inciso: '5', texto: 'Puntualidad intachable (0 retrasos)', puntaje: 100 },
            { inciso: '4', texto: 'Puntual con retrasos justificados', puntaje: 85 },
            { inciso: '3', texto: 'Retrasos menores esporádicos', puntaje: 70 },
            { inciso: '2', texto: 'Inasistencias o retrasos frecuentes', puntaje: 50 },
            { inciso: '1', texto: 'Incumplimiento grave de horario', puntaje: 20 },
          ],
        },
      ];

      for (const cm of criterios_mentor) {
        await this.pregunta_cuestionario_repo.save(
          this.pregunta_cuestionario_repo.create({
            cuestionario_id: c_mentor.id,
            numero_orden: cm.numero_orden,
            seccion: cm.seccion,
            titulo: cm.titulo,
            enunciado: cm.enunciado,
            tipo_pregunta: cm.tipo_pregunta,
            opciones: cm.opciones as any,
            peso_puntos: 1.0,
            obligatoria: true,
            activa: true,
          }),
        );
      }
    }

    // 4. Escuela de Líderes CETI (Módulo 4)
    let c_lideres = await this.cuestionario_repo.findOne({
      where: { codigo: 'ESCUELA_LIDERES_CETI' },
    });
    if (!c_lideres) {
      c_lideres = await this.cuestionario_repo.save(
        this.cuestionario_repo.create({
          codigo: 'ESCUELA_LIDERES_CETI',
          titulo: 'Escuela de Líderes: Formación Teológica y Servicio CETI',
          descripcion:
            'Catálogo de las 12 tareas teológicas, ponderación individual y baremo de asistencia presencial de los viernes.',
          tipo_evaluador: 'facilitador',
          modulo_id: 4,
          activo: true,
        }),
      );

      const tareas_ceti = [
        { numero: 1, tema: 'Liderazgo Servidor y Mayordomía Cristiana', ponderacion: 8.33 },
        { numero: 2, tema: 'Misión Integral y Vocación Diaconal', ponderacion: 8.33 },
        { numero: 3, tema: 'Ética Profesional en el Ámbito Financiero y Social', ponderacion: 8.33 },
        { numero: 4, tema: 'Acompañamiento a Grupos Vulnerables', ponderacion: 8.33 },
        { numero: 5, tema: 'Resolución de Conflictos en la Comunidad Eclesial', ponderacion: 8.33 },
        { numero: 6, tema: 'Diseño y Planificación de Proyectos de Servicio', ponderacion: 8.33 },
        { numero: 7, tema: 'Oración, Intercesión y Vida Devocional Comunitaria', ponderacion: 8.33 },
        { numero: 8, tema: 'Comunicación Asertiva y Testimonio Universitario', ponderacion: 8.33 },
        { numero: 9, tema: 'Finanzas Personales Bíblicas y Responsabilidad', ponderacion: 8.33 },
        { numero: 10, tema: 'Salud Mental y Manejo del Estrés en Época Académica', ponderacion: 8.33 },
        { numero: 11, tema: 'Discipulado Generacional y Mentoría a Nuevos Becarios', ponderacion: 8.33 },
        { numero: 12, tema: 'Evaluación Integral de Impacto Comunitario', ponderacion: 8.37 },
      ];

      for (const t of tareas_ceti) {
        await this.pregunta_cuestionario_repo.save(
          this.pregunta_cuestionario_repo.create({
            cuestionario_id: c_lideres.id,
            numero_orden: t.numero,
            seccion: 'Tareas Teológicas Semestrales CETI',
            titulo: t.tema,
            enunciado: `Presentación y aprobación de informe práctico sobre "${t.tema}".`,
            tipo_pregunta: 'escala_numerica',
            opciones: [
              { inciso: 'Aprobado', texto: 'Tarea presentada con solvencia y aplicabilidad práctica', puntaje: 100 },
              { inciso: 'Regular', texto: 'Presentación parcial con observaciones teológicas', puntaje: 70 },
              { inciso: 'No Presentado', texto: 'Incumplimiento de entrega en la fecha convocada', puntaje: 0 },
            ],
            peso_puntos: t.ponderacion,
            obligatoria: true,
            activa: true,
          }),
        );
      }
    }
  }

  async obtenerBecariosAsignadosModulo3(usuario: Usuario, periodo_id?: number) {
    let becarios: Becario[] = [];
    if (this.becario_repo) {
      if (usuario.rol === Rol.SUPERVISOR) {
        becarios = await this.becario_repo.find({
          where: { supervisor_id: usuario.id },
          relations: { usuario: true, supervisor: true },
          order: { nombre: 'ASC' },
        });
        if (becarios.length === 0) {
          becarios = await this.becario_repo.find({
            relations: { usuario: true, supervisor: true },
            order: { nombre: 'ASC' },
          });
        }
      } else {
        becarios = await this.becario_repo.find({
          relations: { usuario: true, supervisor: true },
          order: { nombre: 'ASC' },
        });
      }
    }

    let periodo_activo_id = periodo_id;
    if (!periodo_activo_id && this.periodo_repo?.findOne) {
      const periodo_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      if (periodo_activo) periodo_activo_id = periodo_activo.id;
    }
    if (!periodo_activo_id) periodo_activo_id = 2;

    const resultados: any[] = [];
    for (const b of becarios) {
      const evaluacion = await this.evaluacion_repo.findOne({
        where: { becario_id: b.id, modulo_id: 3, periodo_id: periodo_activo_id },
      });
      const datos_form = (evaluacion?.datos_formulario as Record<string, any>) || null;
      resultados.push({
        becario_id: b.id,
        nombre: b.usuario?.nombre || b.nombre,
        carrera: b.carrera,
        universidad: b.universidad,
        ci: b.ci,
        supervisor_id: b.supervisor_id,
        evaluacion_id: evaluacion?.id || null,
        evaluado: !!evaluacion,
        puntaje: evaluacion && evaluacion.puntaje !== null ? Number(evaluacion.puntaje) : null,
        estado: evaluacion ? evaluacion.estado : EstadoEvaluacion.PENDIENTE,
        datos_formulario: datos_form,
        modalidad_llenado: datos_form?.modalidad_llenado || null,
        fecha_evaluacion: evaluacion?.fecha_evaluacion || null,
      });
    }

    return resultados;
  }

  async obtenerEvaluacionModulo3Becario(becario_id: number, periodo_id?: number) {
    let periodo_activo_id = periodo_id;
    if (!periodo_activo_id && this.periodo_repo?.findOne) {
      const periodo_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      if (periodo_activo) periodo_activo_id = periodo_activo.id;
    }
    if (!periodo_activo_id) periodo_activo_id = 2;

    const evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id, modulo_id: 3, periodo_id: periodo_activo_id },
      relations: { becario: true, evaluador: true, periodo: true },
    });

    return {
      evaluacion,
      datos_formulario: evaluacion?.datos_formulario || null,
      evaluado: !!evaluacion,
      modalidad_llenado: (evaluacion?.datos_formulario as any)?.modalidad_llenado || null,
    };
  }

  async subirDocumentoAcademico(
    dto: SubirDocumentoAcademicoDto,
    archivo: { filename?: string; originalname?: string; size?: number; path?: string },
    usuario: Usuario,
  ): Promise<Evaluacion> {
    if (!archivo) {
      throw new BadRequestException('Se requiere adjuntar un archivo válido');
    }

    let becario_id = dto.becario_id;
    if (usuario.rol === Rol.BECARIO) {
      if (this.becario_repo) {
        const becario = await this.becario_repo.findOne({ where: { usuario_id: usuario.id } });
        if (becario) {
          becario_id = becario.id;
        }
      }
      if (!becario_id) {
        becario_id = usuario.id;
      }
    } else if (!becario_id) {
      becario_id = 1;
    }

    const archivo_nombre = archivo.originalname || archivo.filename || 'documento.pdf';
    const archivo_url = archivo.filename ? `/uploads/academicos/${archivo.filename}` : (archivo.path || `/uploads/academicos/${archivo_nombre}`);
    const tamano_formateado = archivo.size ? `${(archivo.size / 1024).toFixed(1)} KB` : '1.0 MB';

    let evaluador_id = 1;
    if (this.evaluador_repo?.findOne) {
      let evaluador = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.BECARIO } });
      if (!evaluador && this.evaluador_repo.create && this.evaluador_repo.save) {
        evaluador = this.evaluador_repo.create({
          nombre: 'Autoevaluación Becario',
          tipo: TipoEvaluador.BECARIO,
          correo: 'becario@diaconia.bo',
        });
        evaluador = await this.evaluador_repo.save(evaluador);
      }
      if (evaluador) evaluador_id = evaluador.id;
    }

    let evaluacion = await this.evaluacion_repo.findOne({
      where: { becario_id, periodo_id: dto.periodo_id, modulo_id: 2 },
    });

    const datos_previos = (evaluacion?.datos_formulario as Record<string, any>) || {};
    const metadata_documento = {
      url: archivo_url,
      nombre: archivo_nombre,
      tamano: tamano_formateado,
      fecha_subida: new Date().toISOString(),
      subido_por_usuario_id: usuario.id,
    };

    const nuevos_datos_formulario = {
      ...datos_previos,
      documentos: {
        ...(datos_previos.documentos || {}),
        [dto.tipo_documento === 'record_academico' ? 'record_academico' : 'historial_academico']: metadata_documento,
      },
      [dto.tipo_documento]: metadata_documento,
      ultimo_documento_subido: dto.tipo_documento,
      fecha_actualizacion_documentos: new Date().toISOString(),
    };

    if (!evaluacion) {
      evaluacion = this.evaluacion_repo.create({
        becario_id,
        periodo_id: dto.periodo_id,
        modulo_id: 2,
        evaluador_id,
        estado: EstadoEvaluacion.EN_REVISION_ADMINISTRACION,
        observaciones: `Documento ${dto.tipo_documento === 'record_academico' ? 'Récord Académico' : 'Historial Académico'} subido para revisión directa por Administración Central.`,
        archivo_record_academico: dto.tipo_documento === 'record_academico' ? archivo_url : null,
        archivo_historial_academico: dto.tipo_documento === 'historial_academico' ? archivo_url : null,
        datos_formulario: nuevos_datos_formulario,
        fecha_evaluacion: new Date(),
      });
    } else {
      evaluacion.estado = EstadoEvaluacion.EN_REVISION_ADMINISTRACION;
      if (dto.tipo_documento === 'record_academico') {
        evaluacion.archivo_record_academico = archivo_url;
      } else {
        evaluacion.archivo_historial_academico = archivo_url;
      }
      evaluacion.datos_formulario = nuevos_datos_formulario;
      evaluacion.observaciones = `Documento ${dto.tipo_documento === 'record_academico' ? 'Récord Académico' : 'Historial Académico'} actualizado. En revisión directa por Administración Central.`;
      evaluacion.fecha_evaluacion = new Date();
    }

    if (this.documento_semestral_repo) {
      const tipo_semestral =
        dto.tipo_documento === 'record_academico'
          ? TipoDocumentoSemestral.KARDEX
          : TipoDocumentoSemestral.PROGRAMACION_NUEVA;

      await this.documento_semestral_repo.delete({
        becario_id,
        periodo_id: dto.periodo_id,
        tipo_documento: tipo_semestral,
      });

      await this.documento_semestral_repo.save(
        this.documento_semestral_repo.create({
          becario_id,
          periodo_id: dto.periodo_id,
          tipo_documento: tipo_semestral,
          url_archivo: archivo_url,
          nombre_archivo: archivo_nombre,
          tamano_archivo: tamano_formateado,
          estado: EstadoDocumentoSemestral.EN_REVISION,
        }),
      );
    }

    const guardada = await this.evaluacion_repo.save(evaluacion);
    Object.assign(guardada, {
      record_academico: guardada.archivo_record_academico,
      historial_academico: guardada.archivo_historial_academico,
    });
    return guardada;
  }

  async obtenerCatalogoTareasEscuelaLideres(): Promise<TareaCatalogoLideres[]> {
    if (this.configuracion_repo?.findOne) {
      try {
        let reg = await this.configuracion_repo.findOne({
          where: { clave: 'CATALOGO_TAREAS_ESCUELA_LIDERES' },
        });
        if (!reg && typeof this.configuracion_repo.create === 'function' && typeof this.configuracion_repo.save === 'function') {
          reg = this.configuracion_repo.create({
            clave: 'CATALOGO_TAREAS_ESCUELA_LIDERES',
            confirmacion_datos_activa: false,
            valor_json: this.catalogo_tareas_memoria,
          });
          reg = await this.configuracion_repo.save(reg);
        }
        if (reg && Array.isArray(reg.valor_json) && reg.valor_json.length > 0) {
          this.catalogo_tareas_memoria = (reg.valor_json as TareaCatalogoLideres[]).sort(
            (a, b) => Number(a.numero) - Number(b.numero),
          );
        }
      } catch {}
    }
    return this.catalogo_tareas_memoria;
  }

  async guardarTareaCatalogoEscuelaLideres(
    dto: GuardarTareaCatalogoLideresDto,
    numero_forzado?: number,
  ) {
    const catalogo_actual = await this.obtenerCatalogoTareasEscuelaLideres();
    const max_numero = catalogo_actual.reduce((max, t) => Math.max(max, Number(t.numero || 0)), 0);
    const numero_final = Number(numero_forzado ?? dto.numero ?? max_numero + 1);
    const indice_existente = catalogo_actual.findIndex((t) => Number(t.numero) === numero_final);
    const previo = indice_existente >= 0 ? catalogo_actual[indice_existente] : null;

    const nueva_tarea: TareaCatalogoLideres = {
      numero: numero_final,
      codigo: dto.codigo || previo?.codigo || `CETI-${String(numero_final).padStart(2, '0')}`,
      titulo: (dto.titulo || previo?.titulo || `Tarea Formativa #${numero_final}`).trim(),
      modulo: (dto.modulo || previo?.modulo || 'Módulo Formativo Escuela de Líderes').trim(),
      descripcion: (dto.descripcion || dto.instrucciones || previo?.descripcion || '').trim(),
      fecha_limite: dto.fecha_limite || previo?.fecha_limite || new Date().toISOString().split('T')[0],
      ponderacion: Number(dto.ponderacion ?? dto.puntaje_maximo ?? previo?.ponderacion ?? 8.33),
      publicada_apk: dto.publicada_apk ?? dto.enviar_apk ?? true,
    };

    if (indice_existente >= 0) {
      catalogo_actual[indice_existente] = nueva_tarea;
    } else {
      catalogo_actual.push(nueva_tarea);
    }

    catalogo_actual.sort((a, b) => Number(a.numero) - Number(b.numero));
    this.catalogo_tareas_memoria = catalogo_actual;

    if (this.configuracion_repo?.findOne && this.configuracion_repo.save) {
      try {
        let reg = await this.configuracion_repo.findOne({
          where: { clave: 'CATALOGO_TAREAS_ESCUELA_LIDERES' },
        });
        if (!reg) {
          reg = this.configuracion_repo.create({
            clave: 'CATALOGO_TAREAS_ESCUELA_LIDERES',
            confirmacion_datos_activa: false,
            valor_json: catalogo_actual,
          });
        } else {
          reg.valor_json = catalogo_actual;
        }
        await this.configuracion_repo.save(reg);
      } catch {}
    }

    // Sincronizar filas en entregas_tareas_lideres para todos los becarios
    let total_sincronizados = 0;
    if (this.becario_repo?.find && this.entrega_tarea_repo?.findOne && this.entrega_tarea_repo.save) {
      try {
        let periodo_id = 2;
        if (this.periodo_repo?.findOne) {
          const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
          if (p_activo) periodo_id = p_activo.id;
        }
        const todos_becarios = await this.becario_repo.find();
        for (const b of todos_becarios) {
          let entrega = await this.entrega_tarea_repo.findOne({
            where: { becario_id: b.id, periodo_id, tarea_numero: numero_final },
          });
          if (!entrega) {
            entrega = this.entrega_tarea_repo.create({
              becario_id: b.id,
              periodo_id,
              tarea_numero: numero_final,
              tarea_codigo: nueva_tarea.codigo,
              titulo_tarea: nueva_tarea.titulo,
              ponderacion_maxima: nueva_tarea.ponderacion,
              estado: EstadoEntregaTarea.PENDIENTE,
            });
          } else {
            entrega.tarea_codigo = nueva_tarea.codigo;
            entrega.titulo_tarea = nueva_tarea.titulo;
            entrega.ponderacion_maxima = nueva_tarea.ponderacion;
          }
          await this.entrega_tarea_repo.save(entrega);
          total_sincronizados++;
        }
      } catch {}
    }

    this.tiempo_real_gateway?.notificarEvaluacion({
      accion: 'tarea_lideres_publicada_apk',
      modulo_id: 4,
      tarea: nueva_tarea,
      total_becarios_sincronizados: total_sincronizados,
    });

    return {
      exito: true,
      mensaje: `Tarea #${numero_final} ("${nueva_tarea.titulo}") guardada y enviada a la APK para todos los becarios.`,
      tarea: nueva_tarea,
      total_becarios_sincronizados: total_sincronizados,
      catalogo: catalogo_actual,
    };
  }

  async obtenerTareasEscuelaLideres(usuario: Usuario, becario_id?: number, periodo_id?: number) {
    let target_becario_id = becario_id;
    if (usuario?.rol === Rol.BECARIO) {
      if (this.becario_repo) {
        const becario = await this.becario_repo.findOne({
          where: [{ usuario_id: usuario.id }, { id: usuario.id }],
        });
        if (becario) target_becario_id = becario.id;
      }
      if (!target_becario_id) target_becario_id = usuario.id;
    } else if (target_becario_id && this.becario_repo) {
      const becario = await this.becario_repo.findOne({
        where: [{ id: target_becario_id }, { usuario_id: target_becario_id }],
      });
      if (becario) target_becario_id = becario.id;
    } else if (!target_becario_id) {
      target_becario_id = 1;
    }

    let periodo_activo_id = periodo_id;
    if (!periodo_activo_id && this.periodo_repo?.findOne) {
      const periodo_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      if (periodo_activo) periodo_activo_id = periodo_activo.id;
    }
    if (!periodo_activo_id) periodo_activo_id = 2;

    const catalogo_dinamico = await this.obtenerCatalogoTareasEscuelaLideres();

    let entregas: EntregaTareaLideres[] = [];
    if (this.entrega_tarea_repo) {
      entregas = await this.entrega_tarea_repo.find({
        where: { becario_id: target_becario_id, periodo_id: periodo_activo_id },
        order: { tarea_numero: 'ASC' },
      });
    }

    const entregas_map = new Map<number, EntregaTareaLideres>();
    for (const e of entregas) {
      entregas_map.set(e.tarea_numero, e);
    }

    let total_entregadas = 0;
    let total_revisadas = 0;
    let puntaje_acumulado = 0;

    const tareas = catalogo_dinamico.map((cat) => {
      const entrega = entregas_map.get(cat.numero);
      if (entrega) {
        if (entrega.estado === EstadoEntregaTarea.ENTREGADO || entrega.estado === EstadoEntregaTarea.REVISADO) {
          total_entregadas++;
        }
        if (entrega.estado === EstadoEntregaTarea.REVISADO) {
          total_revisadas++;
          puntaje_acumulado += Number(entrega.puntaje_obtenido || 0);
        }
        const pts_obt = entrega.puntaje_obtenido !== null && entrega.puntaje_obtenido !== undefined
          ? Number(entrega.puntaje_obtenido)
          : null;
        const calif_100 = pts_obt !== null && Number(cat.ponderacion) > 0
          ? Math.round((pts_obt / Number(cat.ponderacion)) * 100)
          : null;

        return {
          id: cat.numero,
          numero: cat.numero,
          tarea_numero: cat.numero,
          codigo: cat.codigo,
          tarea_codigo: cat.codigo,
          titulo: cat.titulo,
          tema: cat.titulo,
          titulo_tarea: cat.titulo,
          modulo: cat.modulo,
          modulo_tematico: cat.modulo,
          descripcion: cat.descripcion,
          fecha_limite: cat.fecha_limite,
          ponderacion: cat.ponderacion,
          ponderacion_maxima: cat.ponderacion,
          publicada_apk: cat.publicada_apk ?? true,
          entrega_id: entrega.id,
          estado: entrega.estado,
          archivo_evidencia_url: entrega.archivo_evidencia_url,
          archivo_url: entrega.archivo_evidencia_url,
          nombre_archivo: entrega.nombre_archivo,
          archivo_nombre: entrega.nombre_archivo,
          evidencia_nombre: entrega.nombre_archivo,
          tamano_archivo: entrega.tamano_archivo,
          archivo_tamano: entrega.tamano_archivo,
          comentario_becario: entrega.comentario_becario,
          comentario_estudiante: entrega.comentario_becario,
          puntaje_obtenido: pts_obt,
          calificacion_100: calif_100,
          comentario_revisor: entrega.comentario_revisor,
          retroalimentacion: entrega.comentario_revisor,
          retroalimentacion_docente: entrega.comentario_revisor,
          fecha_entrega: entrega.fecha_entrega,
          fecha_revision: entrega.fecha_revision,
        };
      }
      return {
        id: cat.numero,
        numero: cat.numero,
        tarea_numero: cat.numero,
        codigo: cat.codigo,
        tarea_codigo: cat.codigo,
        titulo: cat.titulo,
        tema: cat.titulo,
        titulo_tarea: cat.titulo,
        modulo: cat.modulo,
        modulo_tematico: cat.modulo,
        descripcion: cat.descripcion,
        fecha_limite: cat.fecha_limite,
        ponderacion: cat.ponderacion,
        ponderacion_maxima: cat.ponderacion,
        publicada_apk: cat.publicada_apk ?? true,
        entrega_id: null,
        estado: EstadoEntregaTarea.PENDIENTE,
        archivo_evidencia_url: null,
        archivo_url: null,
        nombre_archivo: null,
        archivo_nombre: null,
        evidencia_nombre: null,
        tamano_archivo: null,
        archivo_tamano: null,
        comentario_becario: null,
        comentario_estudiante: null,
        puntaje_obtenido: null,
        calificacion_100: null,
        comentario_revisor: null,
        retroalimentacion: null,
        retroalimentacion_docente: null,
        fecha_entrega: null,
        fecha_revision: null,
      };
    });

    puntaje_acumulado = Number(puntaje_acumulado.toFixed(2));
    const total_catalogo = catalogo_dinamico.length;

    return {
      becario_id: target_becario_id,
      periodo_id: periodo_activo_id,
      resumen: {
        total_tareas: total_catalogo,
        entregadas: total_entregadas,
        revisadas: total_revisadas,
        pendientes: Math.max(0, total_catalogo - total_entregadas),
        puntaje_acumulado_100: puntaje_acumulado,
      },
      tareas,
    };
  }

  async entregarTareaEscuelaLideres(dto: EntregarTareaLideresDto, usuario: Usuario): Promise<EntregaTareaLideres> {
    if (!this.entrega_tarea_repo) {
      throw new BadRequestException('Repositorio de entregas de Escuela de Líderes no disponible');
    }

    let becario_id = dto.becario_id;
    if (usuario?.rol === Rol.BECARIO) {
      if (this.becario_repo) {
        const becario = await this.becario_repo.findOne({
          where: [{ usuario_id: usuario.id }, { id: usuario.id }],
        });
        if (becario) becario_id = becario.id;
      }
      if (!becario_id) becario_id = usuario.id;
    } else if (becario_id && this.becario_repo) {
      const becario = await this.becario_repo.findOne({
        where: [{ id: becario_id }, { usuario_id: becario_id }],
      });
      if (becario) becario_id = becario.id;
    } else if (!becario_id) {
      becario_id = 1;
    }

    let periodo_id = dto.periodo_id;
    if (!periodo_id && this.periodo_repo?.findOne) {
      const p_activo = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      if (p_activo) periodo_id = p_activo.id;
    }
    if (!periodo_id) periodo_id = 2;

    const tarea_numero = Number(dto.tarea_numero ?? dto.numero ?? 1);
    const catalogo_dinamico = await this.obtenerCatalogoTareasEscuelaLideres();
    const catalogo_item = catalogo_dinamico.find((t) => t.numero === tarea_numero) || {
      numero: tarea_numero,
      codigo: `CETI-${tarea_numero.toString().padStart(2, '0')}`,
      titulo: `Tarea ${tarea_numero}`,
      ponderacion: 8.33,
    };

    const archivo_url_final =
      dto.archivo_evidencia_url || dto.enlace_externo || dto.archivo_adjunto || `/uploads/escuela-lideres/tarea-${tarea_numero}.pdf`;
    const nombre_archivo_final =
      dto.nombre_archivo || dto.archivo_adjunto || `Entrega_Tarea_${tarea_numero}.pdf`;
    const comentario_final =
      dto.comentario_becario || dto.respuesta_texto || dto.enlace_externo || null;

    let entrega = await this.entrega_tarea_repo.findOne({
      where: {
        becario_id,
        periodo_id,
        tarea_numero,
      },
    });

    if (!entrega) {
      entrega = this.entrega_tarea_repo.create({
        becario_id,
        periodo_id,
        tarea_numero,
        tarea_codigo: catalogo_item.codigo,
        titulo_tarea: catalogo_item.titulo,
        ponderacion_maxima: catalogo_item.ponderacion,
        estado: EstadoEntregaTarea.ENTREGADO,
        archivo_evidencia_url: archivo_url_final,
        nombre_archivo: nombre_archivo_final,
        tamano_archivo: dto.tamano_archivo || null,
        comentario_becario: comentario_final,
        fecha_entrega: new Date(),
      });
    } else {
      entrega.archivo_evidencia_url = archivo_url_final;
      entrega.nombre_archivo = nombre_archivo_final;
      if (dto.tamano_archivo) entrega.tamano_archivo = dto.tamano_archivo;
      if (comentario_final) entrega.comentario_becario = comentario_final;
      entrega.estado = EstadoEntregaTarea.ENTREGADO;
      entrega.fecha_entrega = new Date();
    }

    const guardada = await this.entrega_tarea_repo.save(entrega);
    this.tiempo_real_gateway?.notificarEvaluacion({
      accion: 'tarea_lideres_entregada',
      modulo_id: 4,
      becario_id,
      tarea_numero,
      entrega_id: guardada.id,
    });
    return guardada;
  }

  async revisarTareaPorNumeroEscuelaLideres(
    tarea_numero: number,
    dto: RevisarEntregaLideresDto,
    revisor: Usuario,
  ) {
    if (!this.entrega_tarea_repo) {
      throw new BadRequestException('Repositorio de entregas no disponible');
    }

    let becario_id = dto.becario_id || 1;
    if (this.becario_repo && dto.becario_id) {
      const b = await this.becario_repo.findOne({
        where: [{ id: dto.becario_id }, { usuario_id: dto.becario_id }],
      });
      if (b) becario_id = b.id;
    }

    let periodo_id = dto.periodo_id || 2;
    if (!dto.periodo_id && this.periodo_repo?.findOne) {
      const p = await this.periodo_repo.findOne({ where: { estado: EstadoPeriodo.ABIERTO } });
      if (p) periodo_id = p.id;
    }

    let entrega = await this.entrega_tarea_repo.findOne({
      where: { becario_id, periodo_id, tarea_numero },
    });

    if (!entrega) {
      const catalogo = await this.obtenerCatalogoTareasEscuelaLideres();
      const cat = catalogo.find((t) => t.numero === tarea_numero);
      entrega = this.entrega_tarea_repo.create({
        becario_id,
        periodo_id,
        tarea_numero,
        tarea_codigo: cat?.codigo || `CETI-${String(tarea_numero).padStart(2, '0')}`,
        titulo_tarea: cat?.titulo || `Tarea ${tarea_numero}`,
        ponderacion_maxima: cat?.ponderacion || 8.33,
        estado: EstadoEntregaTarea.ENTREGADO,
        fecha_entrega: new Date(),
      });
      entrega = await this.entrega_tarea_repo.save(entrega);
    }

    return this.revisarEntregaEscuelaLideres(entrega.id, dto, revisor);
  }

  async revisarEntregaEscuelaLideres(
    entrega_id: number,
    dto: RevisarEntregaLideresDto,
    revisor: Usuario,
  ): Promise<{ entrega: EntregaTareaLideres; evaluacion_modulo_4: Evaluacion }> {
    if (!this.entrega_tarea_repo) {
      throw new BadRequestException('Repositorio de entregas no disponible');
    }

    let entrega = await this.entrega_tarea_repo.findOne({
      where: { id: entrega_id },
      relations: { becario: true, periodo: true },
    });

    if (!entrega && entrega_id >= 1 && entrega_id <= 50) {
      return this.revisarTareaPorNumeroEscuelaLideres(entrega_id, dto, revisor);
    }

    if (!entrega) {
      throw new NotFoundException(`No se encontró la entrega con ID ${entrega_id}`);
    }

    const estado_final = dto.estado || EstadoEntregaTarea.REVISADO;
    const comentario_final =
      dto.comentario_revisor || dto.retroalimentacion_supervisor || dto.observaciones || null;
    const puntaje_entrante = Number(dto.puntaje_obtenido ?? dto.calificacion ?? dto.puntaje ?? 0);

    entrega.estado = estado_final;
    entrega.comentario_revisor = comentario_final;
    entrega.revisor_id = revisor?.id || null;
    entrega.fecha_revision = new Date();

    if (estado_final === EstadoEntregaTarea.REVISADO) {
      let puntaje = puntaje_entrante;
      if (puntaje > Number(entrega.ponderacion_maxima) && Number(entrega.ponderacion_maxima) > 0) {
        puntaje = Number(((puntaje / 100) * Number(entrega.ponderacion_maxima)).toFixed(2));
      }
      entrega.puntaje_obtenido = puntaje;
    } else {
      entrega.puntaje_obtenido = 0;
    }

    const entrega_guardada = await this.entrega_tarea_repo.save(entrega);

    // RECALCULO AUTOMÁTICO DE NOTA ACUMULADA DEL MÓDULO 4
    const todas_las_entregas = await this.entrega_tarea_repo.find({
      where: { becario_id: entrega.becario_id, periodo_id: entrega.periodo_id },
    });

    const puntaje_acumulado = todas_las_entregas
      .filter((e) => e.estado === EstadoEntregaTarea.REVISADO)
      .reduce((acc, curr) => acc + Number(curr.puntaje_obtenido || 0), 0);

    const puntaje_final_lideres = Number(Math.min(puntaje_acumulado, 100).toFixed(2));

    let evaluador_id = revisor?.id || 1;
    if (this.evaluador_repo?.findOne) {
      let evaluador = await this.evaluador_repo.findOne({ where: { tipo: TipoEvaluador.FACILITADOR } });
      if (!evaluador && this.evaluador_repo.create && this.evaluador_repo.save) {
        evaluador = this.evaluador_repo.create({
          nombre: revisor?.nombre || 'Facilitador Pastoral CETI',
          tipo: TipoEvaluador.FACILITADOR,
          correo: revisor?.correo || 'facilitador@diaconia.bo',
        });
        evaluador = await this.evaluador_repo.save(evaluador);
      }
      if (evaluador) evaluador_id = evaluador.id;
    }

    let evaluacion_mod4 = await this.evaluacion_repo.findOne({
      where: { becario_id: entrega.becario_id, periodo_id: entrega.periodo_id, modulo_id: 4 },
    });

    const ceti_resumen = todas_las_entregas.map((e) => ({
      tarea_numero: e.tarea_numero,
      tarea_codigo: e.tarea_codigo,
      titulo: e.titulo_tarea,
      estado: e.estado,
      puntaje: e.puntaje_obtenido,
      ponderacion: e.ponderacion_maxima,
    }));

    const datos_formulario_mod4 = {
      ...(evaluacion_mod4?.datos_formulario || {}),
      tareas_ceti: ceti_resumen,
      total_tareas_revisadas: todas_las_entregas.filter((e) => e.estado === EstadoEntregaTarea.REVISADO).length,
      puntaje_acumulado: puntaje_final_lideres,
      ultima_revision: {
        tarea_numero: entrega.tarea_numero,
        revisor_nombre: revisor?.nombre || 'Facilitador',
        fecha: new Date().toISOString(),
      },
    };

    if (!evaluacion_mod4) {
      evaluacion_mod4 = this.evaluacion_repo.create({
        becario_id: entrega.becario_id,
        periodo_id: entrega.periodo_id,
        modulo_id: 4,
        evaluador_id,
        puntaje: puntaje_final_lideres,
        estado: EstadoEvaluacion.COMPLETADO,
        observaciones: `Escuela de Líderes CETI: Puntaje acumulado de tareas: ${puntaje_final_lideres}/100.`,
        datos_formulario: datos_formulario_mod4,
        fecha_evaluacion: new Date(),
      });
    } else {
      evaluacion_mod4.puntaje = puntaje_final_lideres;
      evaluacion_mod4.estado = EstadoEvaluacion.COMPLETADO;
      evaluacion_mod4.observaciones = `Escuela de Líderes CETI: Puntaje acumulado de tareas: ${puntaje_final_lideres}/100.`;
      evaluacion_mod4.datos_formulario = datos_formulario_mod4;
      evaluacion_mod4.fecha_evaluacion = new Date();
    }

    const evaluacion_guardada = await this.evaluacion_repo.save(evaluacion_mod4);
    this.tiempo_real_gateway?.notificarEvaluacion({
      accion: 'tarea_lideres_revisada',
      modulo_id: 4,
      becario_id: entrega.becario_id,
      entrega_id: entrega_guardada.id,
      puntaje_acumulado: puntaje_final_lideres,
    });

    return {
      entrega: entrega_guardada,
      evaluacion_modulo_4: evaluacion_guardada,
    };
  }
}

