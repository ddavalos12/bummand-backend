export const CODIGOS_ERROR = {
  ERR_1001: 'ERR-1001',
  ERR_1002: 'ERR-1002',
  ERR_1003: 'ERR-1003',
  ERR_1004: 'ERR-1004',
  ERR_AUTORIZACION_0001: 'ERR-AUTORIZACION-0001',

  ERR_2001: 'ERR-2001',
  ERR_2002: 'ERR-2002',
  ERR_2003: 'ERR-2003',
  ERR_2004: 'ERR-2004',

  ERR_3001: 'ERR-3001',
  ERR_3002: 'ERR-3002',
  ERR_3003: 'ERR-3003',
  ERR_3004: 'ERR-3004',

  ERR_4001: 'ERR-4001',
  ERR_4002: 'ERR-4002',
  ERR_4003: 'ERR-4003',
  ERR_4004: 'ERR-4004',

  ERR_5001: 'ERR-5001',
  ERR_5002: 'ERR-5002',
  ERR_5003: 'ERR-5003',

  ERR_9001: 'ERR-9001',
  ERR_9002: 'ERR-9002',
} as const;

export type CodigoError = (typeof CODIGOS_ERROR)[keyof typeof CODIGOS_ERROR];

export const DESCRIPCIONES_ERROR: Record<CodigoError, string> = {
  [CODIGOS_ERROR.ERR_1001]: 'Credenciales inválidas',
  [CODIGOS_ERROR.ERR_1002]: 'Token JWT expirado o inválido',
  [CODIGOS_ERROR.ERR_1003]: 'Permiso denegado por rol RBAC',
  [CODIGOS_ERROR.ERR_1004]: 'Usuario deshabilitado o inactivo',
  [CODIGOS_ERROR.ERR_AUTORIZACION_0001]: 'No autorizado para modificar campos protegidos de becario',

  [CODIGOS_ERROR.ERR_2001]: 'Ubicación GPS fuera del radio de tolerancia de la geocerca',
  [CODIGOS_ERROR.ERR_2002]: 'Marcación de asistencia fuera de la ventana horaria permitida',
  [CODIGOS_ERROR.ERR_2003]: 'Asistencia de ingreso ya registrada para la fecha',
  [CODIGOS_ERROR.ERR_2004]: 'No existe marcación de ingreso previa para registrar salida',

  [CODIGOS_ERROR.ERR_3001]: 'Solicitud rechazada: declaración permitida únicamente a partir del día 24',
  [CODIGOS_ERROR.ERR_3002]: 'Cálculo de centavos de viáticos inválido o tarifa no homologada',
  [CODIGOS_ERROR.ERR_3003]: 'Ya existe una solicitud de viáticos enviada o aprobada para este periodo',
  [CODIGOS_ERROR.ERR_3004]: 'Observación obligatoria no provista para rechazar solicitud',

  [CODIGOS_ERROR.ERR_4001]: 'Evento no encontrado o finalizado',
  [CODIGOS_ERROR.ERR_4002]: 'Asistencia al evento fuera del radio geodésico',
  [CODIGOS_ERROR.ERR_4003]: 'Contenido de reflexión devocional vacío o inferior al mínimo',
  [CODIGOS_ERROR.ERR_4004]: 'Motivo y justificación detallada obligatoria',

  [CODIGOS_ERROR.ERR_5001]: 'Conexión de red no disponible / Fallo de comunicación',
  [CODIGOS_ERROR.ERR_5002]: 'Validación fallida: campos obligatorios vacíos o con formato inválido',
  [CODIGOS_ERROR.ERR_5003]: 'Servidor no responde: solicitud encolada en modo offline',

  [CODIGOS_ERROR.ERR_9001]: 'Error interno del servidor no controlado',
  [CODIGOS_ERROR.ERR_9002]: 'Entidad o recurso no encontrado en base de datos',
};

export const DOMINIOS_ERROR: Record<CodigoError, string> = {
  [CODIGOS_ERROR.ERR_1001]: 'AUTENTICACION_SEGURIDAD',
  [CODIGOS_ERROR.ERR_1002]: 'AUTENTICACION_SEGURIDAD',
  [CODIGOS_ERROR.ERR_1003]: 'AUTENTICACION_SEGURIDAD',
  [CODIGOS_ERROR.ERR_1004]: 'AUTENTICACION_SEGURIDAD',
  [CODIGOS_ERROR.ERR_AUTORIZACION_0001]: 'AUTENTICACION_SEGURIDAD',

  [CODIGOS_ERROR.ERR_2001]: 'ASISTENCIA_GEOCERCA',
  [CODIGOS_ERROR.ERR_2002]: 'ASISTENCIA_GEOCERCA',
  [CODIGOS_ERROR.ERR_2003]: 'ASISTENCIA_GEOCERCA',
  [CODIGOS_ERROR.ERR_2004]: 'ASISTENCIA_GEOCERCA',

  [CODIGOS_ERROR.ERR_3001]: 'PASAJES_VIATICOS',
  [CODIGOS_ERROR.ERR_3002]: 'PASAJES_VIATICOS',
  [CODIGOS_ERROR.ERR_3003]: 'PASAJES_VIATICOS',
  [CODIGOS_ERROR.ERR_3004]: 'PASAJES_VIATICOS',

  [CODIGOS_ERROR.ERR_4001]: 'DEVOCIONALES_EVENTOS',
  [CODIGOS_ERROR.ERR_4002]: 'DEVOCIONALES_EVENTOS',
  [CODIGOS_ERROR.ERR_4003]: 'DEVOCIONALES_EVENTOS',
  [CODIGOS_ERROR.ERR_4004]: 'DEVOCIONALES_EVENTOS',

  [CODIGOS_ERROR.ERR_5001]: 'CLIENTE_RED_VALIDACION',
  [CODIGOS_ERROR.ERR_5002]: 'CLIENTE_RED_VALIDACION',
  [CODIGOS_ERROR.ERR_5003]: 'CLIENTE_RED_VALIDACION',

  [CODIGOS_ERROR.ERR_9001]: 'SISTEMA',
  [CODIGOS_ERROR.ERR_9002]: 'SISTEMA',
};
