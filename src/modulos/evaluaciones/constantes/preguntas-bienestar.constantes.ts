export interface PreguntaBienestarDefecto {
  numero_orden: number;
  titulo: string;
  enunciado: string;
  categoria: string;
  opciones: Array<{
    inciso: string;
    texto: string;
    puntaje: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  }>;
  activa: boolean;
}

export const PREGUNTAS_BIENESTAR_DEFECTO: PreguntaBienestarDefecto[] = [
  {
    numero_orden: 1,
    titulo: 'Ingresos del hogar',
    enunciado: '¿Los ingresos de su hogar alcanzan para cubrir las necesidades básicas?',
    categoria: 'Economía Familiar',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Alcanzan y permiten ahorrar.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Alcanzan con dificultad.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No alcanzan.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 2,
    titulo: 'Ahorros familiares',
    enunciado: '¿Su familia cuenta con ahorros para emergencias?',
    categoria: 'Economía Familiar',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, suficientes.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Sí, pero son insuficientes.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No tiene ahorros.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 3,
    titulo: 'Fuentes de ingreso',
    enunciado: '¿Cuántas fuentes de ingreso tiene su hogar?',
    categoria: 'Economía Familiar',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Dos o más fuentes estables.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Una fuente estable.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Solo ingresos ocasionales o ninguno.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 4,
    titulo: 'Capacidad para generar ingresos',
    enunciado: '¿Qué capacidad tiene para generar ingresos?',
    categoria: 'Economía Familiar',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Puedo generar ingresos de manera constante.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Puedo generarlos, pero de manera irregular.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Actualmente tengo muchas dificultades para generarlos.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 5,
    titulo: 'Documentación de identidad',
    enunciado: '¿Los integrantes de su hogar cuentan con cédula de identidad vigente?',
    categoria: 'Identidad y Ciudadanía',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Todos.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Solo algunos.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Ninguno.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 6,
    titulo: 'Acceso a agua potable',
    enunciado: '¿Su hogar tiene acceso a agua potable?',
    categoria: 'Vivienda y Servicios Básicos',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, todos los días.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Sí, pero con interrupciones.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No tiene acceso.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 7,
    titulo: 'Atención médica',
    enunciado: '¿Puede recibir atención médica cuando la necesita?',
    categoria: 'Salud y Nutrición',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, oportunamente.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Sí, pero con dificultades.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No puedo recibirla.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 8,
    titulo: 'Alimentación',
    enunciado: '¿Con qué frecuencia su familia consume alimentos variados y nutritivos?',
    categoria: 'Salud y Nutrición',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Todos los días.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Algunos días.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Casi nunca.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 9,
    titulo: 'Salud dental',
    enunciado: '¿En qué estado se encuentra su salud dental?',
    categoria: 'Salud y Nutrición',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sin molestias ni problemas conocidos.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Con molestias ocasionales o tratamientos pendientes.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Con dolor frecuente o problemas sin atender.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 10,
    titulo: 'Vacunación',
    enunciado: '¿Los integrantes de su hogar tienen las vacunas que les corresponden según su edad?',
    categoria: 'Salud y Nutrición',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Todos tienen sus vacunas al día.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Algunos tienen vacunas pendientes.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Ninguno tiene sus vacunas al día.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 11,
    titulo: 'Seguridad de la vivienda',
    enunciado: '¿Su vivienda ofrece condiciones de seguridad para vivir?',
    categoria: 'Vivienda y Servicios Básicos',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, se encuentra en buen estado.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Presenta daños menores que necesitan reparación.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Presenta daños que ponen en riesgo a sus habitantes.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 12,
    titulo: 'Servicios sanitarios',
    enunciado: '¿Su hogar dispone de baño y un sistema adecuado para eliminar las aguas residuales?',
    categoria: 'Vivienda y Servicios Básicos',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, ambos funcionan adecuadamente.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Sí, pero presentan problemas.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No dispone de condiciones adecuadas.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 13,
    titulo: 'Electricidad',
    enunciado: '¿Su hogar cuenta con electricidad?',
    categoria: 'Vivienda y Servicios Básicos',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, de manera constante.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Sí, pero con cortes frecuentes.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No cuenta con electricidad.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 14,
    titulo: 'Transporte público',
    enunciado: '¿Puede acceder al transporte público cuando lo necesita?',
    categoria: 'Movilidad y Transporte',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, fácilmente.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Sí, pero con dificultades de distancia, horario o costo.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No puedo acceder.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 15,
    titulo: 'Lectura y comprensión',
    enunciado: '¿Puede leer y comprender un texto cotidiano, como un aviso o una instrucción?',
    categoria: 'Educación y Habilidades',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, sin dificultad.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Sí, con alguna dificultad.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No puedo hacerlo.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 16,
    titulo: 'Organización económica',
    enunciado: '¿Cómo organiza los ingresos y gastos de su hogar?',
    categoria: 'Economía Familiar',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Elaboro un presupuesto y llevo un control.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Los organizo parcialmente.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'No llevo un control.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 17,
    titulo: 'Seguridad personal',
    enunciado: '¿Qué tan seguro se siente en su vida cotidiana?',
    categoria: 'Seguridad y Protección',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Seguro la mayor parte del tiempo.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Inseguro en algunas situaciones.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Inseguro con frecuencia.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 18,
    titulo: 'Resolución de conflictos familiares',
    enunciado: '¿Cómo suelen resolver los conflictos en su familia?',
    categoria: 'Entorno Familiar',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Mediante el diálogo y acuerdos.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Con discusiones y dificultad para llegar a acuerdos.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Los conflictos suelen quedar sin resolver.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 19,
    titulo: 'Violencia intrafamiliar',
    enunciado: '¿En su hogar se presentan situaciones de violencia física, psicológica o sexual?',
    categoria: 'Entorno Familiar',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'No se presentan.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Se han presentado en alguna ocasión.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Se presentan de manera frecuente.', puntaje: 0.0, semaforo: 'rojo' },
      { inciso: 'D', texto: 'Prefiero no responder.', puntaje: 0.5, semaforo: 'amarillo' },
    ],
  },
  {
    numero_orden: 20,
    titulo: 'Autonomía personal',
    enunciado: '¿Puede tomar decisiones sobre su vida y sus actividades?',
    categoria: 'Desarrollo Personal',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Sí, con autonomía.', puntaje: 1.0, semaforo: 'verde' },
      { inciso: 'B', texto: 'Solo en algunos aspectos.', puntaje: 0.5, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Otras personas deciden por mí.', puntaje: 0.0, semaforo: 'rojo' },
    ],
  },
  {
    numero_orden: 21,
    titulo: 'Motivación y satisfacción con los estudios',
    enunciado: '¿Qué tan satisfecho se siente con lo que está estudiando?',
    categoria: 'Bienestar Universitario',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'No me gusta lo que estudio y considero abandonarlo.', puntaje: 0.0, semaforo: 'rojo' },
      { inciso: 'B', texto: 'Tengo dudas y encuentro poco interés en los contenidos.', puntaje: 0.33, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Me gusta lo que estudio y deseo continuar.', puntaje: 0.67, semaforo: 'verde' },
      { inciso: 'D', texto: 'Me entusiasma lo que estudio y lo relaciono con mis metas personales.', puntaje: 1.0, semaforo: 'verde' },
    ],
  },
  {
    numero_orden: 22,
    titulo: 'Condiciones y recursos para estudiar',
    enunciado: '¿Cuenta con un espacio y los materiales necesarios para estudiar?',
    categoria: 'Bienestar Universitario',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'No cuento con un espacio adecuado ni con los materiales básicos.', puntaje: 0.0, semaforo: 'rojo' },
      { inciso: 'B', texto: 'Tengo algunas condiciones, pero las limitaciones dificultan mis estudios.', puntaje: 0.33, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Cuento con lo necesario, aunque ocasionalmente me falta algún recurso.', puntaje: 0.67, semaforo: 'verde' },
      { inciso: 'D', texto: 'Dispongo de un espacio adecuado y de todos los recursos que necesito.', puntaje: 1.0, semaforo: 'verde' },
    ],
  },
  {
    numero_orden: 23,
    titulo: 'Libertad para expresar opiniones',
    enunciado: '¿Qué tan cómodo se siente al expresar sus ideas o inquietudes en clases?',
    categoria: 'Bienestar Universitario',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Evito expresarme por temor a burlas o reacciones negativas.', puntaje: 0.0, semaforo: 'rojo' },
      { inciso: 'B', texto: 'Me expreso pocas veces porque no siento suficiente confianza.', puntaje: 0.33, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Generalmente puedo expresar mis opiniones con confianza.', puntaje: 0.67, semaforo: 'verde' },
      { inciso: 'D', texto: 'Me expreso con libertad y siento que mis aportes son escuchados.', puntaje: 1.0, semaforo: 'verde' },
    ],
  },
  {
    numero_orden: 24,
    titulo: 'Metas durante la carrera — Corto plazo',
    enunciado: '¿Qué tan definidas tiene sus metas de estudio actualmente?',
    categoria: 'Bienestar Universitario',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Me siento desorientado; necesito consejería o apoyo académico.', puntaje: 0.0, semaforo: 'rojo' },
      { inciso: 'B', texto: 'Avanzo materia a materia, pero me cuesta planificar a futuro.', puntaje: 0.33, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Tengo metas claras para aprobar y mejorar mis habilidades.', puntaje: 0.67, semaforo: 'verde' },
      { inciso: 'D', texto: 'Tengo un plan bien definido con cursos y proyectos clave.', puntaje: 1.0, semaforo: 'verde' },
    ],
  },
  {
    numero_orden: 25,
    titulo: 'Transición al mundo laboral — Mediano plazo',
    enunciado: '¿Tiene un plan para cuando termine la universidad?',
    categoria: 'Bienestar Universitario',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'No sé qué hacer al salir; requiero orientación laboral.', puntaje: 0.0, semaforo: 'rojo' },
      { inciso: 'B', texto: 'Tengo una idea general, pero no sé cómo empezar a buscar empleo.', puntaje: 0.33, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Conozco los pasos básicos —titulación y pasantías— para empezar.', puntaje: 0.67, semaforo: 'verde' },
      { inciso: 'D', texto: 'Cuento con una estrategia clara y metas profesionales definidas.', puntaje: 1.0, semaforo: 'verde' },
    ],
  },
  {
    numero_orden: 26,
    titulo: 'Visión de desarrollo profesional — Largo plazo',
    enunciado: '¿Cómo ve su futuro profesional tras graduarse?',
    categoria: 'Bienestar Universitario',
    activa: true,
    opciones: [
      { inciso: 'A', texto: 'Siento incertidumbre; necesito asesoría de perfil profesional.', puntaje: 0.0, semaforo: 'rojo' },
      { inciso: 'B', texto: 'Buscaré cualquier empleo disponible para ganar estabilidad.', puntaje: 0.33, semaforo: 'amarillo' },
      { inciso: 'C', texto: 'Planeo trabajar un tiempo y luego evaluar un posgrado.', puntaje: 0.67, semaforo: 'verde' },
      { inciso: 'D', texto: 'Tengo un plan claro que combina trabajo y especialización.', puntaje: 1.0, semaforo: 'verde' },
    ],
  },
];
