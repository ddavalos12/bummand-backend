import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluacion, EstadoEvaluacion } from './entidades/evaluacion.entidad';
import { ModuloEvaluacion } from './entidades/modulo-evaluacion.entidad';
import { PeriodoEvaluacion, EstadoPeriodo } from './entidades/periodo-evaluacion.entidad';
import { Evaluador } from './entidades/evaluador.entidad';
import { EvaluacionPastor } from './entidades/evaluacion-pastor.entidad';
import { CrearEvaluacionDto } from './dtos/crear-evaluacion.dto';
import { GuardarFormularioF03Dto } from './dtos/guardar-formulario-f03.dto';
import { CrearPeriodoEvaluacionDto } from './dtos/crear-periodo-evaluacion.dto';
import { ActualizarPeriodoEvaluacionDto } from './dtos/actualizar-periodo-evaluacion.dto';
import { BibliaServicio } from '../biblia/biblia.servicio';

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
    private readonly biblia_servicio?: BibliaServicio,
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
      3: periodo?.peso_practicas !== undefined && periodo?.peso_practicas !== null
        ? Number(periodo.peso_practicas)
        : PESOS_PONDERADOS_MODULOS[3].peso_porcentaje,
      4: periodo?.peso_mentor !== undefined && periodo?.peso_mentor !== null
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
    evaluacion_id: number,
    dto: GuardarFormularioF03Dto,
  ): Promise<EvaluacionPastor> {
    const evaluacion = await this.evaluacion_repo.findOne({ where: { id: evaluacion_id } });
    if (!evaluacion) {
      throw new NotFoundException(`Evaluación con ID ${evaluacion_id} no encontrada`);
    }

    let detalle = await this.evaluacion_pastor_repo.findOne({ where: { evaluacion_id } });
    if (!detalle) {
      detalle = this.evaluacion_pastor_repo.create({
        evaluacion_id,
        pastor_nombre: dto.pastor_nombre,
        pastor_correo: dto.pastor_correo || null,
        pastor_celular: dto.pastor_celular || null,
        iglesia_nombre: dto.iglesia_nombre,
        iglesia_direccion: dto.iglesia_direccion || null,
        campos_formulario: dto.campos_formulario || null,
      });
    } else {
      detalle.pastor_nombre = dto.pastor_nombre;
      if (dto.pastor_correo !== undefined) detalle.pastor_correo = dto.pastor_correo;
      if (dto.pastor_celular !== undefined) detalle.pastor_celular = dto.pastor_celular;
      if (dto.iglesia_nombre !== undefined) detalle.iglesia_nombre = dto.iglesia_nombre;
      if (dto.iglesia_direccion !== undefined) detalle.iglesia_direccion = dto.iglesia_direccion;
      if (dto.campos_formulario !== undefined) detalle.campos_formulario = dto.campos_formulario;
    }

    const pastor_guardado = await this.evaluacion_pastor_repo.save(detalle);

    if (dto.puntaje !== undefined) {
      evaluacion.puntaje = dto.puntaje;
      evaluacion.estado = EstadoEvaluacion.COMPLETADO;
    }
    if (dto.observaciones !== undefined) {
      evaluacion.observaciones = dto.observaciones;
    }
    evaluacion.fecha_evaluacion = new Date();
    await this.evaluacion_repo.save(evaluacion);

    return pastor_guardado;
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
}
