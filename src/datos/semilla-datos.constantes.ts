/**
 * Constantes institucionales para la semilla de base de datos de BUMAND.
 * Extraídas directamente de los registros oficiales, asignaciones de prácticas,
 * fotos de horarios de apoyo y planillas de evaluación de Diaconía FRIF-IFD.
 */

export interface AdministradorSemilla {
  nombre: string;
  correo: string;
  clave: string;
  cargo: string;
}

export interface SupervisorSemilla {
  nombre: string;
  correo: string;
  clave: string;
  unidad: string;
  cargo: string;
  telefono: string;
}

export interface BecarioSemilla {
  ci: string;
  lugar_expedicion?: string;
  estado_civil?: string;
  sexo?: string;
  nombre: string;
  ceti?: number;
  celular?: string;
  correo: string;
  fecha_nacimiento?: string;
  edad?: number;
  direccion?: string;
  ciudad?: string;
  clave?: string;
  carrera: string;
  universidad: string;
  institucion?: string;
  unidad: string;
  ubicacion?: string;
  supervisor_correo?: string;
  horario_semanal?: Record<string, string>;
  iglesia_nombre?: string;
  modalidad_carrera?: string;
  tipo_beca?: string;
  comentario_academico?: string;
  comentario_iglesia?: string;
}

export interface IglesiaSemilla {
  nombre: string;
  direccion: string;
  pastor: string;
  telefono: string;
  latitud?: number;
  longitud?: number;
  radio_tolerancia_m?: number;
  pastor_correo?: string;
}

export const ADMINISTRADORES_SEMILLA: AdministradorSemilla[] = [
  {
    "nombre": "Coordinación General BUMAND",
    "correo": "coordinacion@bumand.bo",
    "clave": "Bumand2026!",
    "cargo": "Coordinación Institucional y Dirección del Programa BUMAND"
  }
];

export const SUPERVISORES_SEMILLA: SupervisorSemilla[] = [
  {
    "nombre": "Angel Javier Ali Paz",
    "correo": "angel.ali@bumand.bo",
    "clave": "Bumand2026!",
    "unidad": "Jefatura de Seguridad Física",
    "cargo": "Tutor General de Prácticas / Jefe de Seguridad Física",
    "telefono": "72345678"
  },
  {
    "nombre": "Claudia Consuelo Cabrera Delgado",
    "correo": "claudia.cabrera@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Consultorio Médico / SGN Talento Humano",
    "cargo": "Responsable de Consultorio Médico / Talento Humano",
    "telefono": "71982341"
  },
  {
    "nombre": "Rodrigo Solorzano San Martin",
    "correo": "rodrigo.solorzano@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Productos y Canales / SGN de Captaciones",
    "cargo": "Responsable de Productos y Canales Financieros",
    "telefono": "72091823"
  },
  {
    "nombre": "Elsa Quinteros Aquino",
    "correo": "elsa.quinteros@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Finanzas y Tesorería",
    "cargo": "Responsable de Finanzas y Tesorería",
    "telefono": "73019284"
  },
  {
    "nombre": "Hugo Seifert",
    "correo": "hugo.seifert@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Gerencia Nacional de Riesgos",
    "cargo": "Gerente Nacional de Riesgos",
    "telefono": "74028391"
  },
  {
    "nombre": "Max Arthur Reynoso Espinoza",
    "correo": "max.reynoso@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Jefatura de Marketing y Comunicación",
    "cargo": "Jefe de Marketing y Comunicación Institucional",
    "telefono": "75039482"
  },
  {
    "nombre": "Mildrette Rojas Soliz",
    "correo": "mildrette.rojas@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Jefatura de Planificación, Control y Presupuesto",
    "cargo": "Jefa de Planificación, Control y Presupuesto",
    "telefono": "76049583"
  },
  {
    "nombre": "Franz Raul Salazar Vasquez",
    "correo": "franz.salazar@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Auditoría Interna",
    "cargo": "Auditor Interno Institucional",
    "telefono": "77059684"
  },
  {
    "nombre": "Reynaldo Alavi Paz",
    "correo": "reynaldo.alavi@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Seguros / SGN Captaciones y Servicios Financieros",
    "cargo": "Responsable de Seguros y Captaciones",
    "telefono": "78069785"
  },
  {
    "nombre": "Alberto Iber Leon Coronado",
    "correo": "alberto.leon@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Seguridad de la Información",
    "cargo": "Oficial de Seguridad de la Información",
    "telefono": "79079886"
  },
  {
    "nombre": "Ramiro Riera",
    "correo": "ramiro.riera@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Subgerencia Nacional de Administración",
    "cargo": "Subgerente Nacional de Administración",
    "telefono": "71182930"
  },
  {
    "nombre": "Eilen Astorga",
    "correo": "eilen.astorga@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Subgerencia Nacional de Administración",
    "cargo": "Administradora de Operaciones",
    "telefono": "72293041"
  },
  {
    "nombre": "Cheryl Lissett Zegarra Corminales",
    "correo": "cheryl.zegarra@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Captaciones y Canales",
    "cargo": "Especialista de Captaciones y Canales",
    "telefono": "73304152"
  },
  {
    "nombre": "Juan Perez",
    "correo": "juan.perez@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Contabilidad e Impuestos",
    "cargo": "Jefe de Contabilidad e Impuestos",
    "telefono": "74415263"
  },
  {
    "nombre": "Ricardo Martin Menacho Salas",
    "correo": "ricardo.menacho@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Jefatura de Procesos y Normas",
    "cargo": "Jefe de Procesos y Normas",
    "telefono": "75526374"
  },
  {
    "nombre": "Brian Marcelo Siles Loras",
    "correo": "brian.siles@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Gerencia Nacional de Cumplimiento",
    "cargo": "Oficial de Cumplimiento Normativo",
    "telefono": "76637485"
  },
  {
    "nombre": "Samuel Martín Durán Baspineiro",
    "correo": "samuel.duran@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Sostenibilidad y Responsabilidad Diaconal (RSDyA)",
    "cargo": "Responsable de Responsabilidad Social y Diaconal",
    "telefono": "77748596"
  },
  {
    "nombre": "Carlos Alanoca Pari",
    "correo": "carlos.alanoca@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Jefatura de Crédito Individual y Cartera Productiva",
    "cargo": "Jefe de Crédito Individual y Cartera Productiva",
    "telefono": "78859607"
  },
  {
    "nombre": "Adams Callejas",
    "correo": "adams.callejas@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Gerencia Nacional de Cumplimiento",
    "cargo": "Analista de Cumplimiento y Control",
    "telefono": "79960718"
  },
  {
    "nombre": "Walter Laime Poma",
    "correo": "walter.laime@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Subgerencia Nacional de Finanzas",
    "cargo": "Analista Financiero Senior",
    "telefono": "71071829"
  },
  {
    "nombre": "Anai Linda Paye Fabian",
    "correo": "anai.paye@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Subgerencia Nacional RSDyA",
    "cargo": "Coordinadora de Proyectos Diaconales",
    "telefono": "72182930"
  },
  {
    "nombre": "Maritza Aguilar Rodrigo",
    "correo": "maritza.aguilar@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Subgerencia Nacional de Finanzas",
    "cargo": "Tesorera Institucional",
    "telefono": "73293041"
  },
  {
    "nombre": "Jaime Rodrigo Poma Cruz",
    "correo": "jaime.poma@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Subgerencia Nacional de Administración e Infraestructura",
    "cargo": "Encargado de Mantenimiento, Activos Fijos e Infraestructura",
    "telefono": "74304152"
  },
  {
    "nombre": "Fernando Castillo Vedia",
    "correo": "fernando.castillo@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Jefatura de Redes y Comunicaciones",
    "cargo": "Jefe de Redes y Telecomunicaciones",
    "telefono": "75415263"
  },
  {
    "nombre": "María Angélica Crespo Patzi",
    "correo": "maria.crespo@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Gerencia Nacional de Riesgos",
    "cargo": "Analista de Riesgo Crediticio y Operativo",
    "telefono": "76526374"
  },
  {
    "nombre": "Jenny Ramos Ticona",
    "correo": "jenny.ramos@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Gerencia Nacional de Auditoría",
    "cargo": "Auditora Operativa Senior",
    "telefono": "77637485"
  },
  {
    "nombre": "Raisa Noelia Arce Humerez",
    "correo": "raisa.arce@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Jefatura de Procesos y Normas",
    "cargo": "Analista de Organización y Métodos",
    "telefono": "78748596"
  },
  {
    "nombre": "Pamela Sanchez Cachi",
    "correo": "pamela.sanchez@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Subgerencia Nacional RSDyA",
    "cargo": "Facilitadora de Acción Social Diaconal",
    "telefono": "79859607"
  },
  {
    "nombre": "Alejandra Lizeth Romay Valdez",
    "correo": "alejandra.romay@diaconia.bo",
    "clave": "Bumand2026!",
    "unidad": "Subgerencia de Negocios y Marketing",
    "cargo": "Especialista en Marketing Digital y Contenido",
    "telefono": "71960718"
  }
];

export const BECARIOS_SEMILLA: BecarioSemilla[] = [
  {
    "ci": "13696496",
    "lugar_expedicion": "LP",
    "estado_civil": "Soltero",
    "sexo": "F",
    "nombre": "Adai Belen Huayta Cardozo",
    "ceti": 3,
    "celular": "79541458",
    "correo": "adaibelen017@gmail.com",
    "fecha_nacimiento": "01/07/1999",
    "edad": 27,
    "direccion": "Pasaje 21 de noviembre",
    "ciudad": "El Alto",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Estadística",
    "unidad": "Productos y Canales",
    "ubicacion": "2 PISO BLOQUE A",
    "iglesia_nombre": "Sinai Los Andes",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "13:00 - 16:30",
      "miercoles": "13:00 - 16:30",
      "viernes": "09:00 - 14:00"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "650",
    "comentario_academico": "materia con abandono  nota 38, consultar.",
    "comentario_iglesia": "Falta de tiempo en sus deberes"
  },
  {
    "ci": "9107373",
    "lugar_expedicion": "LP",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Daniel Davalos Quiñonez",
    "ceti": 2,
    "celular": "78804045",
    "correo": "daniel234.davalos@gmail.com",
    "fecha_nacimiento": "11/12/1995",
    "edad": 31,
    "direccion": "Calle Luis tapia #27 Z.",
    "ciudad": "La Paz",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Informática",
    "unidad": "Seguridad Física",
    "ubicacion": "3 PISO BLOQUE B",
    "iglesia_nombre": "IGLESIA METODISTA MONTE DE HOREB",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "13:00 - 16:00",
      "viernes": "08:00 - 14:00"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "650",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "Comentarios Positivos."
  },
  {
    "ci": "9160054",
    "lugar_expedicion": "LP",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Edgar Elías Alarcon Huanca",
    "ceti": 2,
    "celular": "60662872",
    "correo": "edgaralarcon112@gmail.com",
    "fecha_nacimiento": "09/07/2000",
    "edad": 26,
    "direccion": "Zona las delicias, calle",
    "ciudad": "La Paz",
    "universidad": "Universidad de Aquino Bolivia",
    "carrera": "Medicina",
    "unidad": "Consultorio Médico",
    "ubicacion": "2 PISO BLOQUE B",
    "iglesia_nombre": "Eli - Ezer",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 16:00",
      "viernes": "10:00 - 14:00"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "650",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "Comentarios Positivos"
  },
  {
    "ci": "10028341",
    "lugar_expedicion": "LP",
    "estado_civil": "Soltero",
    "sexo": "F",
    "nombre": "Nilda Amalia Churata Paye",
    "ceti": 2,
    "celular": "63140016",
    "correo": "nildachurata99@gmail.com",
    "fecha_nacimiento": "16/04/2002",
    "edad": 24,
    "direccion": "Zona Puerto Camacho",
    "ciudad": "El Alto",
    "universidad": "Universidad Pública de El Alto",
    "carrera": "Educación Parvularia",
    "unidad": "Seguridad Física",
    "ubicacion": "3 PISO BLOQUE B",
    "iglesia_nombre": "Iglesia Evangélica Amigos Central de Bolivia Bautista Saavedra Más que Vencedores",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:00 - 13:00",
      "jueves": "08:00 - 13:00"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "650",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "Comentarios Positivos"
  },
  {
    "ci": "10064956",
    "lugar_expedicion": "LP",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Alejandro Roberth Paredes Tarquino",
    "ceti": 1,
    "celular": "78816188",
    "correo": "roberthp092@gmail.com",
    "fecha_nacimiento": "24/10/2004",
    "edad": 22,
    "direccion": "Zona Mcal. Santa Cruz",
    "ciudad": "Viacha",
    "universidad": "Universidad Pública de El Alto",
    "carrera": "Comunicación Social",
    "unidad": "Marketing y Comunicación",
    "ubicacion": "1 PISO BLOQUE B",
    "iglesia_nombre": "Centró Evangelistico Caluyo",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "10:30 - 13:30",
      "jueves": "10:30 - 13:30",
      "viernes": "10:30 - 13:30"
    },
    "modalidad_carrera": "Anual",
    "tipo_beca": "650",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "Comentarios Positivos"
  },
  {
    "ci": "9952878",
    "lugar_expedicion": "LP",
    "estado_civil": "Soltero",
    "sexo": "F",
    "nombre": "Aydee Ruth Ali Condori",
    "ceti": 1,
    "celular": "63101324",
    "correo": "alicondoriaydeeruth@gmail.com",
    "fecha_nacimiento": "03/08/2004",
    "edad": 22,
    "direccion": "Zona Mcal. Sucre Sec",
    "ciudad": "El Alto",
    "universidad": "Universidad Pública de El Alto",
    "carrera": "Contaduría Pública",
    "unidad": "Finanzas y Tesorería",
    "ubicacion": "2 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia del Nazareno El Progreso",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "10:00 - 13:00",
      "jueves": "10:00 - 13:00",
      "viernes": "10:00 - 13:00"
    },
    "modalidad_carrera": "Anual",
    "tipo_beca": "250",
    "comentario_academico": "reprobo 1 materia",
    "comentario_iglesia": "Desarrolla sus dones."
  },
  {
    "ci": "9943280",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Carlos Oscar Luna Lizarraga",
    "ceti": 1,
    "celular": "69902655",
    "correo": "shionaries477@gmail.com",
    "fecha_nacimiento": "04/04/2002",
    "edad": 24,
    "direccion": "Zona El Kenko, Av. Ka",
    "ciudad": "El Alto",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Economía",
    "unidad": "Auditoría Interna",
    "ubicacion": "3 PISO BLOQUE A",
    "iglesia_nombre": "Nazareno 6 de junio",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:00 - 12:00",
      "jueves": "08:00 - 12:00",
      "viernes": "08:00 - 14:00"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "650",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "Comentarios Positivos, es candidato a cargo, no desarrolla nuevos lideres"
  },
  {
    "ci": "10920862",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Isaías Daniel Herrera Mamani",
    "ceti": 1,
    "celular": "62484594",
    "correo": "herreraisaias667@gmail.com",
    "fecha_nacimiento": "31/05/2004",
    "edad": 22,
    "direccion": "Zona Senkata Av. Ojo",
    "ciudad": "El Alto",
    "universidad": "Universidad Pública de El Alto",
    "carrera": "Arquitectura",
    "unidad": "Subgerencia Nacional de Administración",
    "ubicacion": "2 PISO BLOQUE A",
    "iglesia_nombre": "Bautista para la familia",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 12:00",
      "miercoles": "08:00 - 12:00",
      "viernes": "08:00 - 14:00"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "650",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "Un poco impuntual"
  },
  {
    "ci": "14378720",
    "lugar_expedicion": "Viacha",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "José Marcos Suñagua Quispe",
    "ceti": 1,
    "celular": "62270620",
    "correo": "marcossunagua0@gmail.com",
    "fecha_nacimiento": "07/02/2003",
    "edad": 23,
    "direccion": "Zona Tilata - Viacha C",
    "ciudad": "Viacha",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Informática",
    "unidad": "Riesgos",
    "ubicacion": "3 PISO BLOQUE A",
    "iglesia_nombre": "6 de Junio",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "650",
    "comentario_academico": "reprobo 2 materias",
    "comentario_iglesia": "Comentarios Positivos"
  },
  {
    "ci": "12959656",
    "lugar_expedicion": "La Paz",
    "estado_civil": "Soltero",
    "sexo": "F",
    "nombre": "Mariela Dayana Jimenez Chambi",
    "ceti": 1,
    "celular": "70590493",
    "correo": "jimenezcmarielaa@gmail.com",
    "fecha_nacimiento": "19/07/2001",
    "edad": 25,
    "direccion": "Zona Obrajes Bella Vi",
    "ciudad": "La Paz",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Contaduría Pública",
    "unidad": "Seguros",
    "ubicacion": "2 PISO BLOQUE A",
    "iglesia_nombre": "Ministerio misión Boliviana",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:30 - 12:30",
      "jueves": "08:30 - 12:30",
      "viernes": "08:30 - 14:00"
    },
    "modalidad_carrera": "Anual",
    "tipo_beca": "650",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "No ocupa algun cargo, no desarrolla nuevos lideres"
  },
  {
    "ci": "9925727",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltero",
    "sexo": "F",
    "nombre": "Mayherli Alejandra Loza Villalobos",
    "ceti": 1,
    "celular": "60107414",
    "correo": "villalobosbetty96@gmail.com",
    "fecha_nacimiento": "07/06/2003",
    "edad": 23,
    "direccion": "Zona Villa Adela Plan",
    "ciudad": "El Alto",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Contaduría Pública",
    "unidad": "Finanzas y Tesorería",
    "ubicacion": "4 PISO BLOQUE A",
    "iglesia_nombre": "CANAAN",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 12:00",
      "miercoles": "08:00 - 12:00",
      "viernes": "08:00 - 14:00"
    },
    "modalidad_carrera": "Anual",
    "tipo_beca": "250",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "no puede administrar bien su tiempo, no desarrolla nuevos líderes"
  },
  {
    "ci": "7093658",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltero",
    "sexo": "F",
    "nombre": "Noemi Callisaya Alvarez",
    "ceti": 1,
    "celular": "60140086",
    "correo": "k6924383@gmail.com",
    "fecha_nacimiento": "24/04/1999",
    "edad": 27,
    "direccion": "Zona 31 de Enero Av.",
    "ciudad": "El Alto",
    "universidad": "Universidad Pública de El Alto",
    "carrera": "Psicomotricidad y Deportes",
    "unidad": "Consultorio Médico",
    "ubicacion": "2 PISO BLOQUE B",
    "iglesia_nombre": "\"El Progreso\"",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 12:00",
      "miercoles": "08:00 - 12:00",
      "viernes": "08:00 - 14:00"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "650",
    "comentario_academico": "reprobo 1 materia",
    "comentario_iglesia": "Necesita ser guiada en el desarrollo de sus dones"
  },
  {
    "ci": "6172054",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Ronald Mauricio Quiquijana Mayta",
    "ceti": 1,
    "celular": "65604882",
    "correo": "quiquijana333@gmail.com",
    "fecha_nacimiento": "30/06/2001",
    "edad": 25,
    "direccion": "Zona Villa Dolores \"F\"",
    "ciudad": "El Alto",
    "universidad": "Escuela Militar de Ingeniería",
    "carrera": "Ingeniería en Telecomunicaciones",
    "unidad": "Seguridad de la Información",
    "ubicacion": "3 PISO BLOQUE A",
    "iglesia_nombre": "Centro Evangelistico Caluyo",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:30 - 12:30",
      "jueves": "08:30 - 12:30",
      "viernes": "08:30 - 14:00"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "250",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "Introvertido y reservado"
  },
  {
    "ci": "9974211",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Ruddy Flores Tapia",
    "ceti": 1,
    "celular": "78777631",
    "correo": "ruddyalan123@gmail.com",
    "fecha_nacimiento": "03/01/1997",
    "edad": 29,
    "direccion": "Zona 16 de Febrero C",
    "ciudad": "El Alto",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Informática",
    "unidad": "Planificación, Control y Presupuesto",
    "ubicacion": "5 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia del Nazareno Río Seco",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "modalidad_carrera": "Semestral",
    "tipo_beca": "250",
    "comentario_academico": "Aprobado",
    "comentario_iglesia": "le falta conocer a los hermanos mayores, y ha llegado de manera impuntual a las clases que imparte."
  },
  {
    "ci": "8416501",
    "lugar_expedicion": "Provincial",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Gonzalo Valencia Laura",
    "ceti": 0,
    "celular": "75161427",
    "correo": "gonzalovalencialau@gmail.com",
    "fecha_nacimiento": "22/04/2002",
    "edad": 24,
    "direccion": "-16.470978,-68.5061",
    "ciudad": "Provincial",
    "universidad": "Universidad Pública de El Alto",
    "carrera": "Contaduría Pública",
    "unidad": "Contabilidad e Impuestos",
    "ubicacion": "4 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 12:30",
      "miercoles": "08:30 - 12:30"
    }
  },
  {
    "ci": "13088041",
    "lugar_expedicion": "La Paz",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Gustavo Ariel Condori Montaño",
    "ceti": 0,
    "celular": "67339896",
    "correo": "tavitolpb@gmail.com",
    "fecha_nacimiento": "29/07/2003",
    "edad": 23,
    "direccion": "Al inicio de la Av. Mar",
    "ciudad": "La Paz",
    "universidad": "Universidad Salesiana de Bolivia",
    "carrera": "Contaduría Pública",
    "unidad": "Captaciones y Canales",
    "ubicacion": "2 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:30 - 12:30",
      "jueves": "08:30 - 12:30"
    }
  },
  {
    "ci": "13603536",
    "lugar_expedicion": "La Paz",
    "estado_civil": "Soltera",
    "sexo": "F",
    "nombre": "Lisbeth Pacasi Machaca",
    "ceti": 0,
    "celular": "78022401",
    "correo": "lizbethpacasiesperanza@gmail.com",
    "fecha_nacimiento": "27/07/2006",
    "edad": 20,
    "direccion": "Jupapina, calle 11, N",
    "ciudad": "La Paz",
    "universidad": "Universidad de Aquino Bolivia",
    "carrera": "Bioquímica y Farmacia",
    "unidad": "Consultorio Médico",
    "ubicacion": "2 PISO BLOQUE B",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 12:00",
      "miercoles": "08:00 - 12:00"
    }
  },
  {
    "ci": "13693151",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltera",
    "sexo": "F",
    "nombre": "Selena Fernanda Pillco Mamani",
    "ceti": 0,
    "celular": "71957515",
    "correo": "selenafernandapillcomamani@gmail.com",
    "fecha_nacimiento": "25/06/2007",
    "edad": 19,
    "direccion": "EA Junthuma Fabril C",
    "ciudad": "El Alto",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Economía",
    "unidad": "Captaciones y Canales",
    "ubicacion": "2 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:30 - 12:30",
      "jueves": "08:30 - 12:30"
    }
  },
  {
    "ci": "14155448",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltera",
    "sexo": "F",
    "nombre": "Milenka Quispe Coarite",
    "ceti": 0,
    "celular": "63155199",
    "correo": "milenkaquispecoarite@gmail.com",
    "fecha_nacimiento": "21/06/2006",
    "edad": 20,
    "direccion": "z/ Ballivian c/Jose Ch",
    "ciudad": "El Alto",
    "universidad": "Universidad Tecnológica Boliviana",
    "carrera": "Administración de Empresas",
    "unidad": "Procesos y Normas",
    "ubicacion": "4 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 12:30",
      "miercoles": "08:30 - 12:30"
    }
  },
  {
    "ci": "12604724",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltera",
    "sexo": "F",
    "nombre": "Joselin Wara Huanca Paucara",
    "ceti": 0,
    "celular": "75263547",
    "correo": "joselinhuancapaucara@gmail.com",
    "fecha_nacimiento": "02/03/2000",
    "edad": 26,
    "direccion": "Zona Alto Villa Victori",
    "ciudad": "El Alto",
    "universidad": "Universidad Pública de El Alto",
    "carrera": "Contaduría Pública",
    "unidad": "Cumplimiento",
    "ubicacion": "3 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:00 - 12:00",
      "jueves": "08:00 - 12:00"
    }
  },
  {
    "ci": "9208456",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Johan Ludving Misme Flores",
    "ceti": 0,
    "celular": "69865195",
    "correo": "johan69865195@gmail.com",
    "fecha_nacimiento": "27/04/2004",
    "edad": 22,
    "direccion": "Z.EL MIRADOR, AV.",
    "ciudad": "El Alto",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Informática",
    "unidad": "Seguridad de la Información",
    "ubicacion": "3 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 12:30",
      "miercoles": "08:30 - 12:30"
    }
  },
  {
    "ci": "13627440",
    "lugar_expedicion": "El Alto",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Matias Jose Uri Flores",
    "ceti": 0,
    "celular": "72018255",
    "correo": "matiasjoseuriflores@gmail.com",
    "fecha_nacimiento": "24/04/2006",
    "edad": 20,
    "direccion": "Zona 23 de Marzo Ca",
    "ciudad": "El Alto",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Lingüística e Idiomas",
    "unidad": "Sostenibilidad y Responsabilidad Diaconal",
    "ubicacion": "5 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:30 - 12:30",
      "jueves": "08:30 - 12:30"
    }
  },
  {
    "ci": "8411610",
    "lugar_expedicion": "La Paz",
    "estado_civil": "Soltero",
    "sexo": "M",
    "nombre": "Mateo Miguel Cussi Flores",
    "ceti": 0,
    "celular": "65120464",
    "correo": "mateocussi11@gmail.com",
    "fecha_nacimiento": "11/06/2002",
    "edad": 24,
    "direccion": "Z/ BARRIO MUNICIP",
    "ciudad": "La Paz",
    "universidad": "Universidad Mayor de San Andrés",
    "carrera": "Informática",
    "unidad": "Seguros",
    "ubicacion": "2 PISO BLOQUE A",
    "iglesia_nombre": "Iglesia Central El Alto",
    "clave": "Bumand2026!",
    "institucion": "Diaconía FRIF-IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 12:30",
      "miercoles": "08:30 - 12:30"
    }
  }
,
{
  "ci": "12423846",
  "nombre": "Fernando Rene Yujra Quispe",
  "correo": "fernando.yujra@diaconia.bo",
  "clave": "Bumand2026!",
  "universidad": "Universidad Mayor de San Andrés",
  "carrera": "Ingeniería Civil",
  "unidad": "Oficina Central",
  "institucion": "Diaconía FRIF-IFD",
  "modalidad_carrera": "Semestral",
  "tipo_beca": "650",
  "comentario_academico": "reprobo 2 materias, materia de maquinarias aun no hay notas",
  "comentario_iglesia": "Comentarios positivos"
},
{
  "ci": "9927657",
  "nombre": "Luis Santiago Enrriquez Conde",
  "correo": "luis.enrriquez@diaconia.bo",
  "clave": "Bumand2026!",
  "universidad": "Universidad Mayor de San Andrés",
  "carrera": "Ciencias de la Comunicación Social",
  "unidad": "Oficina Central",
  "institucion": "Diaconía FRIF-IFD",
  "modalidad_carrera": "Anual",
  "tipo_beca": "650",
  "comentario_academico": "Aprobado",
  "comentario_iglesia": "Debilidad, falta de tiempo persona muy proactiva con comentarios muy positivos"
},
{
  "ci": "7077936",
  "nombre": "Mario Catunta Laime",
  "correo": "mario.catunta@diaconia.bo",
  "clave": "Bumand2026!",
  "universidad": "Universidad Pública de El Alto",
  "carrera": "Economía",
  "unidad": "Oficina Central",
  "institucion": "Diaconía FRIF-IFD",
  "modalidad_carrera": "Mixta",
  "tipo_beca": "250",
  "comentario_academico": "Aprobado",
  "comentario_iglesia": "Tiende a postergar responsabilidades y descuida otras áreas"
},
{
  "ci": "6950093",
  "nombre": "Jhoselin Quispe Morales",
  "correo": "jhoselin.quispe@diaconia.bo",
  "clave": "Bumand2026!",
  "universidad": "Universidad Mayor de San Andrés",
  "carrera": "Comunicación Social",
  "unidad": "Oficina Central",
  "institucion": "Diaconía FRIF-IFD",
  "modalidad_carrera": "Anual",
  "tipo_beca": "650",
  "comentario_academico": "Aprobado",
  "comentario_iglesia": "Comentarios Positivos"
},
{
  "ci": "10369104",
  "nombre": "Monica Mamani Mamani",
  "correo": "monica.mamani@diaconia.bo",
  "clave": "Bumand2026!",
  "universidad": "Universidad Mayor de San Andrés",
  "carrera": "Lingüística e Idiomas",
  "unidad": "Oficina Central",
  "institucion": "Diaconía FRIF-IFD",
  "modalidad_carrera": "Semestral",
  "tipo_beca": "650",
  "comentario_academico": "Aprobado",
  "comentario_iglesia": "Comentarios muy positivos"
},
{
  "ci": "10930509",
  "nombre": "Cristhian Alejandro Soto Apaza",
  "correo": "cristhian.soto@diaconia.bo",
  "clave": "Bumand2026!",
  "universidad": "Universidad Pública de El Alto",
  "carrera": "Administración de Empresas",
  "unidad": "Oficina Central",
  "institucion": "Diaconía FRIF-IFD",
  "modalidad_carrera": "Anual",
  "tipo_beca": "650",
  "comentario_academico": "Egresado",
  "comentario_iglesia": "Trabajar paciencia"
},
{
  "ci": "10915872",
  "nombre": "Ruth Alesandra Choque Huanca",
  "correo": "ruth.choque@diaconia.bo",
  "clave": "Bumand2026!",
  "universidad": "Universidad Central Sede La Paz",
  "carrera": "Ingeniería comercial",
  "unidad": "Oficina Central",
  "institucion": "Diaconía FRIF-IFD",
  "modalidad_carrera": "Semestral",
  "tipo_beca": "250",
  "comentario_academico": "Aprobado",
  "comentario_iglesia": "Comentarios positivos"
}
];

export const IGLESIAS_SEMILLA: IglesiaSemilla[] = [
  {
    "nombre": "Iglesia Evangélica Amigos Central de Bolivia Bautista Saavedra Más que Vencedores",
    "direccion": "Zona Bautista Saavedra / Villa Adela, El Alto",
    "pastor": "Luis Álvaro Quispe Condori",
    "telefono": "73236864",
    "latitud": -16.531200,
    "longitud": -68.194500,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.luis.quispe@diaconia.bo"
  },
  {
    "nombre": "Eli - Ezer",
    "direccion": "Zona Central / Villa Adela, El Alto",
    "pastor": "Antonio Ali Mayta",
    "telefono": "62388850",
    "latitud": -16.528400,
    "longitud": -68.191200,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.antonio.ali@diaconia.bo"
  },
  {
    "nombre": "Sinai Los Andes",
    "direccion": "Zona Los Andes, El Alto",
    "pastor": "Pedro Pablo Callisaya Callisaya",
    "telefono": "70659050",
    "latitud": -16.519800,
    "longitud": -68.172500,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.pedro.callisaya@diaconia.bo"
  },
  {
    "nombre": "IGLESIA METODISTA MONTE DE HOREB",
    "direccion": "Zona 16 de Julio, El Alto",
    "pastor": "Julio Llanquichoque",
    "telefono": "71209902",
    "latitud": -16.515400,
    "longitud": -68.168900,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.julio.llanquichoque@diaconia.bo"
  },
  {
    "nombre": "Iglesia del Nazareno El Progreso",
    "direccion": "Zona El Progreso, El Alto",
    "pastor": "René Max Condori Quispe",
    "telefono": "72095673",
    "latitud": -16.522000,
    "longitud": -68.181000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.rene.condori@diaconia.bo"
  },
  {
    "nombre": "6 de Junio",
    "direccion": "Zona 6 de Junio, El Alto",
    "pastor": "Abdias Espinoza Aleluya",
    "telefono": "67316797",
    "latitud": -16.509000,
    "longitud": -68.162000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.abdias.espinoza@diaconia.bo"
  },
  {
    "nombre": "Centró Evangelistico Caluyo",
    "direccion": "Zona Caluyo, El Alto",
    "pastor": "David Felix Quispe Quispe",
    "telefono": "70558225",
    "latitud": -16.545000,
    "longitud": -68.178000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.david.quispe@diaconia.bo"
  },
  {
    "nombre": "Iglesia del Nazareno Río Seco",
    "direccion": "Ex-Tranca Río Seco, El Alto",
    "pastor": "Rubén Flores Villa",
    "telefono": "76550588",
    "latitud": -16.486500,
    "longitud": -68.193200,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.ruben.flores@diaconia.bo"
  },
  {
    "nombre": "Nazareno 6 de junio",
    "direccion": "Zona 6 de Junio, El Alto",
    "pastor": "Pastor Abdias",
    "telefono": "67316797",
    "latitud": -16.508500,
    "longitud": -68.161500,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.abdias@diaconia.bo"
  },
  {
    "nombre": "\"El Progreso\"",
    "direccion": "Zona El Progreso, El Alto",
    "pastor": "René Max Condori Quispe",
    "telefono": "72095673",
    "latitud": -16.522000,
    "longitud": -68.181000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.rene.condori2@diaconia.bo"
  },
  {
    "nombre": "Ministerio misión Boliviana",
    "direccion": "Zona Central, El Alto",
    "pastor": "Cristina Elizabeth Lopez Ch",
    "telefono": "76707009",
    "latitud": -16.526000,
    "longitud": -68.185000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.cristina.lopez@diaconia.bo"
  },
  {
    "nombre": "CANAAN",
    "direccion": "Zona Villa Mercedes, El Alto",
    "pastor": "MARIO PACOHUANCA CRUZ",
    "telefono": "63252756",
    "latitud": -16.535000,
    "longitud": -68.189000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.mario.pacohuanca@diaconia.bo"
  },
  {
    "nombre": "Centro Evangelistico Caluyo",
    "direccion": "Zona Caluyo, El Alto",
    "pastor": "David Felix Quispe Quispe",
    "telefono": "70558225",
    "latitud": -16.545000,
    "longitud": -68.178000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.david.caluyo@diaconia.bo"
  },
  {
    "nombre": "Bautista para la familia",
    "direccion": "Zona Villa Dolores, El Alto",
    "pastor": "Alfredo Valencia Vela",
    "telefono": "77775161",
    "latitud": -16.512500,
    "longitud": -68.170000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.alfredo.valencia@diaconia.bo"
  },
  {
    "nombre": "Arca de Dios",
    "direccion": "Zona Senkata, El Alto",
    "pastor": "Abraham Mollo Quenaya",
    "telefono": "74042185",
    "latitud": -16.541000,
    "longitud": -68.182000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.abraham.mollo@diaconia.bo"
  },
  {
    "nombre": "IGLESIA EVANGELICA DE DIOS BOLIVIANA PAMPAHASI",
    "direccion": "Zona Pampahasi Alto, La Paz",
    "pastor": "ANDRES ALARCON",
    "telefono": "76209019",
    "latitud": -16.505000,
    "longitud": -68.105000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.andres.alarcon@diaconia.bo"
  },
  {
    "nombre": "Pacajes",
    "direccion": "Zona Pacajes Caluyo, El Alto",
    "pastor": "Ramiro Zárate García",
    "telefono": "67061212",
    "latitud": -16.539000,
    "longitud": -68.179000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.ramiro.zarate@diaconia.bo"
  },
  {
    "nombre": "Bet-el",
    "direccion": "Zona Villa Adela, El Alto",
    "pastor": "Santiago Aparicio Enrriquez Salinas",
    "telefono": "70544022",
    "latitud": -16.524000,
    "longitud": -68.183000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.santiago.aparicio@diaconia.bo"
  },
  {
    "nombre": "Nazareno Rio Seco",
    "direccion": "Zona Río Seco, El Alto",
    "pastor": "Rubén Wilfredo Flores Villa",
    "telefono": "76550588",
    "latitud": -16.487000,
    "longitud": -68.194000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.ruben.rioseco@diaconia.bo"
  },
  {
    "nombre": "La Hermosa",
    "direccion": "Zona 12 de Octubre, El Alto",
    "pastor": "Héctor Sergio Choque Mamani",
    "telefono": "75239369",
    "latitud": -16.518000,
    "longitud": -68.175000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.hector.choque@diaconia.bo"
  },
  {
    "nombre": "El Buen Pastor",
    "direccion": "Zona Villa Bolívar D, El Alto",
    "pastor": "Manuel Mamani Mamani",
    "telefono": "72003290",
    "latitud": -16.530000,
    "longitud": -68.187000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.manuel.mamani@diaconia.bo"
  },
  {
    "nombre": "Iglesia Central El Alto",
    "direccion": "Av. Juan Pablo II, El Alto",
    "pastor": "David Mamani",
    "telefono": "71234567",
    "latitud": -16.501500,
    "longitud": -68.167000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.david.mamani@diaconia.bo"
  },
  {
    "nombre": "Iglesia Bautista Emanuel - Sopocachi",
    "direccion": "Calle Sánchez Lima, Sopocachi, La Paz",
    "pastor": "Marcos Gutierrez",
    "telefono": "72019283",
    "latitud": -16.508000,
    "longitud": -68.132000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.marcos.gutierrez@diaconia.bo"
  },
  {
    "nombre": "Iglesia Metodista El Salvador",
    "direccion": "Calle 12 de Calacoto, La Paz",
    "pastor": "Esteban Choque",
    "telefono": "73029384",
    "latitud": -16.538500,
    "longitud": -68.084500,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.esteban.choque@diaconia.bo"
  },
  {
    "nombre": "Iglesia Presbiteriana Maranata",
    "direccion": "Av. Perú, La Paz",
    "pastor": "Samuel Miranda",
    "telefono": "74039485",
    "latitud": -16.495000,
    "longitud": -68.142000,
    "radio_tolerancia_m": 60,
    "pastor_correo": "pastor.samuel.miranda@diaconia.bo"
  }
];
