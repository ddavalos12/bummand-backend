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
  nombre: string;
  correo: string;
  clave: string;
  carrera: string;
  universidad: string;
  institucion: string;
  unidad: string;
  ubicacion: string;
  supervisor_correo: string;
  horario_semanal: Record<string, string>;
  iglesia_nombre: string;
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
    "nombre": "Daniel Davalos Quiñonez",
    "correo": "daniel234.davalos@gmail.com",
    "clave": "Bumand2026!",
    "cargo": "Administrador de Sistemas e Infraestructura BUMAND"
  },
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
    "nombre": "Adai Belen Huayta Cardozo",
    "correo": "adai.huayta@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Estadística",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Productos y Canales",
    "ubicacion": "2 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "13:00 - 16:30",
      "miercoles": "13:00 - 16:30",
      "viernes": "09:00 - 14:00"
    },
    "iglesia_nombre": "Sinai Los Andes"
  },
  {
    "ci": "10064956",
    "nombre": "Alejandro Roberth Paredes Tarquino",
    "correo": "alejandro.paredes@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Comunicación Social",
    "universidad": "Universidad Pública de El Alto",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Marketing y Comunicación",
    "ubicacion": "1 PISO BLOQUE B",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "10:30 - 13:30",
      "jueves": "10:30 - 13:30",
      "viernes": "10:30 - 13:30"
    },
    "iglesia_nombre": "Centró Evangelistico Caluyo"
  },
  {
    "ci": "9952878",
    "nombre": "Aydee Ruth Ali Condori",
    "correo": "aydee.ali@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Contaduría Pública",
    "universidad": "Universidad Pública de El Alto",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Finanzas y Tesoreria",
    "ubicacion": "2 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "10:00 - 13:00",
      "jueves": "10:00 - 13:00",
      "viernes": "10:00 - 13:00"
    },
    "iglesia_nombre": "Iglesia del Nazareno El Progreso"
  },
  {
    "ci": "9943280",
    "nombre": "Carlos Oscar Luna Lizarraga",
    "correo": "carlos.luna@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Economía",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Auditoria Interna",
    "ubicacion": "3 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:00 - 12:00",
      "jueves": "08:00 - 12:00",
      "viernes": "08:00 - 14:00"
    },
    "iglesia_nombre": "Nazareno 6 de junio"
  },
  {
    "ci": "10930509",
    "nombre": "Cristhian Alejandro Soto Apaza",
    "correo": "cristhian.soto@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Administración de Empresas",
    "universidad": "Universidad Pública de El Alto",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Finanzas y Tesorería",
    "ubicacion": "Oficina Central Diaconía IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "iglesia_nombre": "Arca de Dios"
  },
  {
    "ci": "9107373",
    "nombre": "Daniel Davalos Quiñonez",
    "correo": "daniel.davalos@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Informática",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Seguridad Física",
    "ubicacion": "3 PISO BLOQUE B",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "13:00 - 16:00",
      "viernes": "08:00 - 14:00"
    },
    "iglesia_nombre": "IGLESIA METODISTA MONTE DE HOREB"
  },
  {
    "ci": "9160054",
    "nombre": "Edgar Elias Alarcon Huanca",
    "correo": "edgar.alarcon@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Medicina",
    "universidad": "Universidad de Aquino Bolivia",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Consultorio Médico",
    "ubicacion": "2 PISO BLOQUE B",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 16:00",
      "viernes": "10:00 - 14:00"
    },
    "iglesia_nombre": "Eli - Ezer"
  },
  {
    "ci": "12423846",
    "nombre": "Fernando Rene Yujra Quispe",
    "correo": "fernando.yujra@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "ING. CIVIL",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "ADMINISTRACION",
    "ubicacion": "Oficina Central Diaconía IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "iglesia_nombre": "IGLESIA EVANGELICA DE DIOS BOLIVIANA PAMPAHASI"
  },
  {
    "ci": "8416501",
    "nombre": "Gonzalo Valencia Laura",
    "correo": "gonzalo.valencia@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Contaduría Pública",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Contabilidad e Impuestos",
    "ubicacion": "4 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "14:00 - 16:00",
      "martes": "13:00 - 14:00",
      "miercoles": "14:00 - 16:00",
      "jueves": "14:00 - 16:00"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
  },
  {
    "ci": "13088041",
    "nombre": "Gustavo Ariel Condori Montaño",
    "correo": "gustavo.condori@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Contaduría Pública",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Captaciones y Canales",
    "ubicacion": "2 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "14:00 - 16:00",
      "martes": "14:00 - 16:00",
      "miercoles": "14:00 - 16:00",
      "jueves": "08:00 - 12:00"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
  },
  {
    "ci": "10920862",
    "nombre": "Isaias Daniel Herrera Mamani",
    "correo": "isaias.herrera@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Arquitectura",
    "universidad": "Universidad Pública de El Alto",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Subgerencia Nacional de Administración",
    "ubicacion": "2 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "09:00 - 15:00",
      "miercoles": "08:00 - 16:00"
    },
    "iglesia_nombre": "Bautista para la familia"
  },
  {
    "ci": "6950093",
    "nombre": "Jhoselin Quispe Morales",
    "correo": "jhoselin.quispe@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Comunicación Social",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Procesos y Normas",
    "ubicacion": "Oficina Central Diaconía IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "iglesia_nombre": "Pacajes"
  },
  {
    "ci": "9208456",
    "nombre": "Johan Ludvig Misme Flores",
    "correo": "johan.misme@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Informatica",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Seguridad de la Información",
    "ubicacion": "3 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 12:30",
      "miercoles": "08:00 - 12:30"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
  },
  {
    "ci": "12604724",
    "nombre": "Joselin Wara Huanca Paucara",
    "correo": "joselin.huanca@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Contaduría Pública",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Cumplimiento",
    "ubicacion": "3 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "13:30 - 16:00",
      "miercoles": "13:30 - 16:00",
      "jueves": "13:30 - 16:00",
      "sabado": "08:30 - 10:00"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
  },
  {
    "ci": "14378720",
    "nombre": "José Marcos Suñagua Quispe",
    "correo": "jose.sunagua@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Informática",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Riesgos",
    "ubicacion": "3 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "miercoles": "08:30 - 11:30",
      "jueves": "08:30 - 11:30",
      "viernes": "08:30 - 13:30"
    },
    "iglesia_nombre": "6 de Junio"
  },
  {
    "ci": "13603536",
    "nombre": "Lizbeth Pacasi Machaca",
    "correo": "lizbeth.pacasi@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Bioquimica y farmacia",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Consultorio Médico",
    "ubicacion": "2 PISO BLOQUE B",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:30 - 14:00",
      "jueves": "11:30 - 15:30"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
  },
  {
    "ci": "9927657",
    "nombre": "Luis Santiago Enrriquez Conde",
    "correo": "luis.enrriquez@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Ciencias de la Comunicación Social",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Unidad de Marketing",
    "ubicacion": "Oficina Central Diaconía IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "iglesia_nombre": "Bet-el"
  },
  {
    "ci": "12959656",
    "nombre": "Mariela Dayana Jimenez Chambi",
    "correo": "mariela.jimenez@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Contaduría Pública",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Seguros",
    "ubicacion": "2 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "14:00 - 18:00",
      "martes": "11:00 - 16:20",
      "jueves": "11:00 - 16:20"
    },
    "iglesia_nombre": "Ministerio misión Boliviana"
  },
  {
    "ci": "7077936",
    "nombre": "Mario Catunta Laime",
    "correo": "mario.catunta@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Economía",
    "universidad": "Universidad Pública de El Alto",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Créditos",
    "ubicacion": "Oficina Central Diaconía IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "iglesia_nombre": "Nazareno Rio Seco"
  },
  {
    "ci": "8411610",
    "nombre": "Mateo Miguel Cussi Flores",
    "correo": "mateo.cussi@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Informatica",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Seguros",
    "ubicacion": "2 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 10:00",
      "miercoles": "08:00 - 10:00",
      "viernes": "08:00 - 13:00"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
  },
  {
    "ci": "13627440",
    "nombre": "Matias José Uri Flores",
    "correo": "matias.uri@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Lingüística e Idiomas",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Sostenibilidad y Responsabilidad Diaconal",
    "ubicacion": "5 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 13:00",
      "martes": "08:00 - 13:00",
      "miercoles": "08:00 - 13:00",
      "jueves": "08:00 - 13:00"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
  },
  {
    "ci": "9925727",
    "nombre": "Mayherli Alejandra Loza Villalobos",
    "correo": "mayherli.loza@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Contaduría Pública",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Finanzas y Tesoreria",
    "ubicacion": "4 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:15 - 14:30",
      "miercoles": "10:00 - 15:00",
      "viernes": "10:00 - 14:00"
    },
    "iglesia_nombre": "CANAAN"
  },
  {
    "ci": "14155448",
    "nombre": "Milenka Quispe Coarite",
    "correo": "milenka.quispe@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Administración de Empresas",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Procesos y Normas",
    "ubicacion": "4 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "miercoles": "08:00 - 13:00",
      "jueves": "08:00 - 12:00"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
  },
  {
    "ci": "10369104",
    "nombre": "Monica Mamani Mamani",
    "correo": "monica.mamani@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Lingüística e Idiomas",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "RSDyA",
    "ubicacion": "Oficina Central Diaconía IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "iglesia_nombre": "La Hermosa"
  },
  {
    "ci": "10028341",
    "nombre": "Nilda Amalia Churata Paye",
    "correo": "nilda.churata@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Educación Parvularia",
    "universidad": "Universidad Pública de El Alto",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Seguridad Física",
    "ubicacion": "3 PISO BLOQUE B",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "martes": "08:00 - 13:00",
      "jueves": "08:00 - 13:00"
    },
    "iglesia_nombre": "Iglesia Evangélica Amigos Central de Bolivia Bautista Saavedra Más que Vencedores"
  },
  {
    "ci": "7093658",
    "nombre": "Noemi Callisaya Alvarez",
    "correo": "noemi.callisaya@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Psicomotricidad y Deportes",
    "universidad": "Universidad Pública de El Alto",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Consultorio Médico",
    "ubicacion": "2 PISO BLOQUE B",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 12:30",
      "viernes": "08:30 - 13:30"
    },
    "iglesia_nombre": "\"El Progreso\""
  },
  {
    "ci": "6172054",
    "nombre": "Ronald Mauricio Quiquijana Mayta",
    "correo": "ronald.quiquijana@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Ingeniería en Telecomunicaciones",
    "universidad": "Escuela Militar de Ingeniería",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Seguridad de la Información",
    "ubicacion": "3 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 16:00",
      "jueves": "14:00 - 16:00"
    },
    "iglesia_nombre": "Centro Evangelistico Caluyo"
  },
  {
    "ci": "9974211",
    "nombre": "Ruddy Flores Tapia",
    "correo": "ruddy.flores@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Informática",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Planificación, Control y Presupuesto",
    "ubicacion": "5 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "09:00 - 16:00",
      "miercoles": "09:00 - 16:00"
    },
    "iglesia_nombre": "Iglesia del Nazareno Río Seco"
  },
  {
    "ci": "10915872",
    "nombre": "Ruth Alesandra Choque Huanca",
    "correo": "ruth.choque@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Ingeniería Comercial",
    "universidad": "Universidad Central Sede La Paz",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Cumplimiento",
    "ubicacion": "Oficina Central Diaconía IFD",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:30 - 16:30",
      "miercoles": "08:30 - 16:30"
    },
    "iglesia_nombre": "El Buen Pastor"
  },
  {
    "ci": "13693151",
    "nombre": "Selena Fernanda Pillco Mamani",
    "correo": "selena.pillco@bumand.bo",
    "clave": "Bumand2026!",
    "carrera": "Economia",
    "universidad": "Universidad Mayor de San Andrés",
    "institucion": "Diaconía FRIF-IFD",
    "unidad": "Captaciones y Canales",
    "ubicacion": "2 PISO BLOQUE A",
    "supervisor_correo": "angel.ali@bumand.bo",
    "horario_semanal": {
      "lunes": "08:00 - 11:00",
      "martes": "08:00 - 10:30",
      "miercoles": "08:00 - 11:00",
      "jueves": "08:00 - 10:30"
    },
    "iglesia_nombre": "Iglesia Central El Alto"
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
