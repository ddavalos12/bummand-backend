import { Injectable, Logger } from '@nestjs/common';

export interface VersiculoBiblico {
  cita: string;
  libro: string;
  capitulo: number;
  versiculo: number;
  texto: string;
  version: string;
  tema: string;
  reflexion_diaconal: string;
}

const MAPA_LIBROS_ID: Record<string, number> = {
  genesis: 1, 'génesis': 1,
  exodo: 2, 'éxodo': 2,
  levitico: 3, 'levítico': 3,
  numeros: 4, 'números': 4,
  deuteronomio: 5,
  josue: 6, 'josué': 6,
  jueces: 7,
  rut: 8,
  '1 samuel': 9, '1samuel': 9,
  '2 samuel': 10, '2samuel': 10,
  '1 reyes': 11, '1reyes': 11,
  '2 reyes': 12, '2reyes': 12,
  '1 cronicas': 13, '1crónicas': 13, '1cronicas': 13,
  '2 cronicas': 14, '2crónicas': 14, '2cronicas': 14,
  esdras: 15,
  nehemias: 16, 'nehemías': 16,
  ester: 17,
  job: 18,
  salmos: 19, salmo: 19,
  proverbios: 20,
  eclesiastes: 21, 'eclesiastés': 21,
  cantares: 22,
  isaias: 23, 'isaías': 23,
  jeremias: 24, 'jeremías': 24,
  lamentaciones: 25,
  ezequiel: 26,
  daniel: 27,
  oseas: 28,
  joel: 29,
  amos: 30, 'amós': 30,
  abdias: 31, 'abdías': 31,
  jonas: 32, 'jonás': 32,
  miqueas: 33,
  nahum: 34,
  habacuc: 35,
  sofonias: 36, 'sofonías': 36,
  hageo: 37,
  zacarias: 38, 'zacarías': 38,
  malaquias: 39, 'malaquías': 39,
  mateo: 40,
  marcos: 41,
  lucas: 42,
  juan: 43,
  hechos: 44,
  romanos: 45,
  '1 corintios': 46, '1corintios': 46,
  '2 corintios': 47, '2corintios': 47,
  galatas: 48, 'gálatas': 48,
  efesios: 49,
  filipenses: 50,
  colosenses: 51,
  '1 tesalonicenses': 52,
  '2 tesalonicenses': 53,
  '1 timoteo': 54,
  '2 timoteo': 55,
  tito: 56,
  filemon: 57, 'filemón': 57,
  hebreos: 58,
  santiago: 59,
  '1 pedro': 60,
  '2 pedro': 61,
  '1 juan': 62,
  '2 juan': 63,
  '3 juan': 64,
  judas: 65,
  apocalipsis: 66,
};

const PAQUETE_DEVOCIONAL_PRECARGADO: VersiculoBiblico[] = [
  {
    cita: 'Filipenses 4:13',
    libro: 'Filipenses',
    capitulo: 4,
    versiculo: 13,
    texto: 'Todo lo puedo en Cristo que me fortalece.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Fortaleza y Servicio',
    reflexion_diaconal: 'En cada labor y apoyo formativo dentro de Diaconía, Cristo es quien renueva nuestras capacidades para servir con excelencia.',
  },
  {
    cita: 'Proverbios 3:5-6',
    libro: 'Proverbios',
    capitulo: 3,
    versiculo: 5,
    texto: 'Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Confianza y Sabiduría',
    reflexion_diaconal: 'Encomienda tus metas profesionales y tu vocación al Señor; Él dirige nuestros pasos ante cada desafío institucional.',
  },
  {
    cita: 'Colosenses 3:23-24',
    libro: 'Colosenses',
    capitulo: 3,
    versiculo: 23,
    texto: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres; sabiendo que del Señor recibiréis la recompensa de la herencia.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Integridad y Esfuerzo',
    reflexion_diaconal: 'Cada tarea asignada en tu sede o agencia es un testimonio vivo del amor de Cristo expresado en el trabajo honesto.',
  },
  {
    cita: 'Josué 1:9',
    libro: 'Josué',
    capitulo: 1,
    versiculo: 9,
    texto: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Valentía Diaconal',
    reflexion_diaconal: 'Da pasos de fe firmes en tu desarrollo académico y liderazgo espiritual, sabiendo que la gracia divina te acompaña siempre.',
  },
  {
    cita: 'Jeremías 29:11',
    libro: 'Jeremías',
    capitulo: 29,
    versiculo: 11,
    texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Esperanza y Futuro',
    reflexion_diaconal: 'Dios tiene un propósito claro de bendición y desarrollo integral para cada becario del programa BUMAND.',
  },
  {
    cita: 'Miqueas 6:8',
    libro: 'Miqueas',
    capitulo: 6,
    versiculo: 8,
    texto: 'Oh hombre, él te ha declarado lo que es bueno, y qué pide Jehová de ti: solamente hacer justicia, y amar misericordia, y humillarte ante tu Dios.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Justicia y Humildad',
    reflexion_diaconal: 'El corazón del ministerio diaconal se fundamenta en la justicia compasiva y el servicio humilde hacia nuestra comunidad.',
  },
  {
    cita: 'Isaías 40:31',
    libro: 'Isaías',
    capitulo: 40,
    versiculo: 31,
    texto: 'Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Renovación Espiritual',
    reflexion_diaconal: 'Cuando sientas agotamiento en tus prácticas o estudios, busca al Señor en oración para recibir nuevas energías.',
  },
  {
    cita: 'Romanos 12:2',
    libro: 'Romanos',
    capitulo: 12,
    versiculo: 2,
    texto: 'No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Transformación y Mente Limpia',
    reflexion_diaconal: 'Tu formación universitaria y formación en valores son instrumentos para transformar positivamente nuestra sociedad.',
  },
  {
    cita: 'Salmos 23:1-3',
    libro: 'Salmos',
    capitulo: 23,
    versiculo: 1,
    texto: 'Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Paz y Cuidado Divino',
    reflexion_diaconal: 'Descansa en la provisión soberana de Dios. En medio de tus responsabilidades diarias, Él cuida de ti con amor pastoral.',
  },
  {
    cita: 'Gálatas 6:9',
    libro: 'Gálatas',
    capitulo: 6,
    versiculo: 9,
    texto: 'No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Perseverancia en el Bien',
    reflexion_diaconal: 'Cada gesto solidario y cada hora de práctica dedicada al servicio rinde frutos duraderos en el Reino de Dios.',
  },
  {
    cita: 'Mateo 5:16',
    libro: 'Mateo',
    capitulo: 5,
    versiculo: 16,
    texto: 'Así alumbre vuestra luz delante de los hombres, para que vean vuestras buenas obras, y glorifiquen a vuestro Padre que está en los cielos.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Testimonio Diaconal',
    reflexion_diaconal: 'Que tu ética, puntualidad y calidez humana sean un reflejo claro de la luz de Cristo para quienes te rodean.',
  },
  {
    cita: '1 Pedro 4:10',
    libro: '1 Pedro',
    capitulo: 4,
    versiculo: 10,
    texto: 'Cada uno según el don que ha recibido, minístrelo a los otros, como buenos administradores de la multiforme gracia de Dios.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Dones para la Comunidad',
    reflexion_diaconal: 'Los talentos profesionales y dones que Dios te otorgó están diseñados para edificar y servir a los demás.',
  },
  {
    cita: 'Salmos 119:105',
    libro: 'Salmos',
    capitulo: 119,
    versiculo: 105,
    texto: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Guía Bíblica',
    reflexion_diaconal: 'La lectura diaria de las Sagradas Escrituras es la brújula confiable que orienta nuestras decisiones cotidianas.',
  },
  {
    cita: 'Efesios 2:10',
    libro: 'Efesios',
    capitulo: 2,
    versiculo: 10,
    texto: 'Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano para que anduviésemos en ellas.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Propósito Divino',
    reflexion_diaconal: 'Fuiste elegido con un plan trascendente: impactar vidas a través del amor activo y la vocación diaconal.',
  },
  {
    cita: 'Santiago 1:5',
    libro: 'Santiago',
    capitulo: 1,
    versiculo: 5,
    texto: 'Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada.',
    version: 'Reina-Valera 1960 (RVR60)',
    tema: 'Sabiduría Práctica',
    reflexion_diaconal: 'En momentos de decisiones complejas en tus estudios o trabajo, acude con confianza a la fuente de toda sabiduría.',
  },
];

@Injectable()
export class BibliaServicio {
  private readonly logger = new Logger(BibliaServicio.name);
  private readonly url_base_api = 'https://evanbible.com/api/v1/RVR60';

  async obtenerVersiculoDiario(fecha?: string): Promise<VersiculoBiblico> {
    const fecha_referencia = fecha ? new Date(fecha) : new Date();
    const indice_dia = Math.abs(fecha_referencia.getDate() - 1) % PAQUETE_DEVOCIONAL_PRECARGADO.length;
    const base_versiculo = PAQUETE_DEVOCIONAL_PRECARGADO[indice_dia];

    try {
      const libro_id = MAPA_LIBROS_ID[base_versiculo.libro.toLowerCase().trim()];
      if (libro_id) {
        const respuesta = await fetch(
          `${this.url_base_api}/${libro_id}/${base_versiculo.capitulo}/${base_versiculo.versiculo}`,
          { signal: AbortSignal.timeout(3500) },
        );

        if (respuesta.ok) {
          const datos = await respuesta.json();
          if (datos && datos.ok && datos.verses && datos.verses.length > 0) {
            const texto_api = datos.verses[0].text?.trim();
            if (texto_api) {
              return {
                ...base_versiculo,
                texto: texto_api,
              };
            }
          }
        }
      }
    } catch (error: any) {
      this.logger.warn(`Uso de respaldo offline para versículo diario: ${error.message}`);
    }

    return base_versiculo;
  }

  obtenerPaqueteOffline(): VersiculoBiblico[] {
    return PAQUETE_DEVOCIONAL_PRECARGADO;
  }

  async buscarPasaje(cita: string): Promise<VersiculoBiblico> {
    const cita_limpia = cita.trim();
    const coincidencia = /^(\d?\s?[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s+(\d+)[:\.](\d+)(?:-\d+)?$/.exec(cita_limpia);

    if (coincidencia) {
      const nombre_libro = coincidencia[1].trim();
      const capitulo = parseInt(coincidencia[2], 10);
      const versiculo = parseInt(coincidencia[3], 10);
      const libro_id = MAPA_LIBROS_ID[nombre_libro.toLowerCase()];

      if (libro_id) {
        try {
          const respuesta = await fetch(
            `${this.url_base_api}/${libro_id}/${capitulo}/${versiculo}`,
            { signal: AbortSignal.timeout(3500) },
          );

          if (respuesta.ok) {
            const datos = await respuesta.json();
            if (datos && datos.ok && datos.verses && datos.verses.length > 0) {
              return {
                cita: `${datos.book_name} ${capitulo}:${versiculo}`,
                libro: datos.book_name,
                capitulo,
                versiculo,
                texto: datos.verses[0].text.trim(),
                version: 'Reina-Valera 1960 (RVR60)',
                tema: 'Lectura Bíblica Diaria',
                reflexion_diaconal: 'Meditad en este pasaje y permitid que la Palabra de Dios guíe vuestras acciones hoy.',
              };
            }
          }
        } catch (error: any) {
          this.logger.warn(`Error al consultar pasaje bíblico en API: ${error.message}`);
        }
      }
    }

    const encontrado_local = PAQUETE_DEVOCIONAL_PRECARGADO.find(
      (v) => v.cita.toLowerCase().includes(cita_limpia.toLowerCase()) || cita_limpia.toLowerCase().includes(v.cita.toLowerCase()),
    );

    if (encontrado_local) {
      return encontrado_local;
    }

    return PAQUETE_DEVOCIONAL_PRECARGADO[0];
  }
}
