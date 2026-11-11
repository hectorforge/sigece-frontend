// ==========================================
// 1. GRAVEDAD
// ==========================================
export const GRAVEDADES = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'] as const;
export type Gravedad = (typeof GRAVEDADES)[number];

export const GRAVEDAD_LABELS: Record<Gravedad, string> = {
  LEVE: 'Leve',
  MODERADO: 'Moderado',
  GRAVE: 'Grave',
  MUY_GRAVE: 'Muy Grave'
};

// ==========================================
// 2. CATEGORÍA SÍSEVE (MINEDU)
// ==========================================
export const CATEGORIAS_SISEVE = [
  // Violencia Física
  'FIS_CASTIGO_FISICO',
  'FIS_CON_LESIONES',
  'FIS_USO_ARMAS',
  'FIS_SIN_LESIONES',
  // Violencia Psicológica
  'PSI_ACOSO_ESCOLAR',
  'PSI_AISLAMIENTO',
  'PSI_CIBERACOSO',
  'PSI_DISCRIMINACION',
  'PSI_USO_ARMAS',
  'PSI_INTIMIDACION',
  'PSI_TRATO_HUMILLANTE',
  'PSI_VERVAL',
  // Violencia Sexual
  'SEX_ACOSO_SEXUAL',
  'SEX_ACOSO_MEDIOS_TECNOLOGICOS',
  'SEX_HOSTIGAMIENTO_SEXUAL',
  'SEX_TOCAMIENTOS_ACTOS_SEXUALES',
  'SEX_VIOLACION_SEXUAL',
  'SEX_VIOLENCIA_FIN_SEXUAL'
] as const;

export type CategoriaSiseve = (typeof CATEGORIAS_SISEVE)[number];

export const CATEGORIA_SISEVE_LABELS: Record<CategoriaSiseve, string> = {
  FIS_CASTIGO_FISICO: 'Castigo físico',
  FIS_CON_LESIONES: 'Violencia física con lesiones',
  FIS_USO_ARMAS: 'Violencia física con uso de armas',
  FIS_SIN_LESIONES: 'Violencia física sin lesiones',
  PSI_ACOSO_ESCOLAR: 'Acoso escolar (Bullying)',
  PSI_AISLAMIENTO: 'Aislamiento o exclusión social',
  PSI_CIBERACOSO: 'Ciberacoso o cyberbullying',
  PSI_DISCRIMINACION: 'Discriminación',
  PSI_USO_ARMAS: 'Amenaza o intimidación psicológica con uso de armas',
  PSI_INTIMIDACION: 'Intimidación o coacción',
  PSI_TRATO_HUMILLANTE: 'Trato humillante o degradante',
  PSI_VERVAL: 'Violencia verbal',
  SEX_ACOSO_SEXUAL: 'Acoso sexual',
  SEX_ACOSO_MEDIOS_TECNOLOGICOS: 'Acoso sexual mediante medios tecnológicos',
  SEX_HOSTIGAMIENTO_SEXUAL: 'Hostigamiento sexual',
  SEX_TOCAMIENTOS_ACTOS_SEXUALES: 'Tocamientos o actos de connotación sexual',
  SEX_VIOLACION_SEXUAL: 'Violación sexual',
  SEX_VIOLENCIA_FIN_SEXUAL: 'Otras formas de violencia con fin sexual'
};

// ==========================================
// 3. ESTADOS INCIDENTE (D.S. N.° 004-2018-MINEDU)
// ==========================================
export const ESTADOS_INCIDENTE = [
  'REGISTRADO',
  'EN_INVESTIGACION',
  'EN_SEGUIMIENTO',
  'RESUELTO',
  'CERRADO'
] as const;
export type EstadoIncidente = (typeof ESTADOS_INCIDENTE)[number];

export const ESTADO_INCIDENTE_LABELS: Record<EstadoIncidente, string> = {
  REGISTRADO: 'Registrado',
  EN_INVESTIGACION: 'En investigación',
  EN_SEGUIMIENTO: 'En seguimiento',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado'
};

// ==========================================
// 4. NIVEL EDUCATIVO
// ==========================================
export const NIVELES = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'] as const;
export type Nivel = (typeof NIVELES)[number];

export const NIVEL_LABELS: Record<Nivel, string> = {
  INICIAL: 'Inicial',
  PRIMARIA: 'Primaria',
  SECUNDARIA: 'Secundaria'
};

// ==========================================
// 5. TIPO DE DOCUMENTO
// ==========================================
export const TIPOS_DOCUMENTO = ['DNI', 'CE', 'PASAPORTE'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  DNI: 'DNI',
  CE: 'Carné de Extranjería',
  PASAPORTE: 'Pasaporte'
};

// ==========================================
// 6. PARENTESCO
// ==========================================
export const PARENTESCOS = [
  'PADRE',
  'MADRE',
  'TIO',
  'TIA',
  'ABUELO',
  'ABUELA',
  'TUTOR_LEGAL',
  'APODERADO'
] as const;
export type Parentesco = (typeof PARENTESCOS)[number];

export const PARENTESCO_LABELS: Record<Parentesco, string> = {
  PADRE: 'Padre',
  MADRE: 'Madre',
  TIO: 'Tío',
  TIA: 'Tía',
  ABUELO: 'Abuelo',
  ABUELA: 'Abuela',
  TUTOR_LEGAL: 'Tutor Legal',
  APODERADO: 'Apoderado'
};

// ==========================================
// 7. MEDIO DE OCURRENCIA
// ==========================================
export const MEDIOS_OCURRENCIA = ['PRESENCIAL', 'DIGITAL'] as const;
export type MedioOcurrencia = (typeof MEDIOS_OCURRENCIA)[number];

export const MEDIO_OCURRENCIA_LABELS: Record<MedioOcurrencia, string> = {
  PRESENCIAL: 'Presencial',
  DIGITAL: 'Digital'
};

// ==========================================
// 8. ROL DEL INVOLUCRADO
// ==========================================
export const ROLES_INVOLUCRADO = ['VICTIMA', 'AGRESOR', 'TESTIGO'] as const;
export type RolInvolucrado = (typeof ROLES_INVOLUCRADO)[number];

export const ROL_INVOLUCRADO_LABELS: Record<RolInvolucrado, string> = {
  VICTIMA: 'Víctima',
  AGRESOR: 'Agresor',
  TESTIGO: 'Testigo'
};

// ==========================================
// 9. TIPO DE ACCIÓN (SEGUIMIENTO)
// ==========================================
export const TIPOS_ACCION = [
  'ENTREVISTA_ESTUDIANTE',
  'ENTREVISTA_PADRES',
  'CITACION_APODERADO',
  'DERIVACION_PSICOLOGIA',
  'MEDIDA_CORRECTIVA_FORMATIVA',
  'DERIVACION_DEMUNA_CEM',
  'ACTA_COMPROMISO',
  'APUNTE_INTERNO',
  'OTRO'
] as const;
export type TipoAccion = (typeof TIPOS_ACCION)[number];

export const TIPO_ACCION_LABELS: Record<TipoAccion, string> = {
  ENTREVISTA_ESTUDIANTE: 'Entrevista con el estudiante',
  ENTREVISTA_PADRES: 'Entrevista con padres de familia',
  CITACION_APODERADO: 'Citación a apoderado',
  DERIVACION_PSICOLOGIA: 'Derivación al área de psicología',
  MEDIDA_CORRECTIVA_FORMATIVA: 'Medida correctiva y formativa',
  DERIVACION_DEMUNA_CEM: 'Derivación a DEMUNA / CEM',
  ACTA_COMPROMISO: 'Firma de acta de compromiso',
  APUNTE_INTERNO: 'Apunte interno',
  OTRO: 'Otro'
};

// ==========================================
// 10. ESTADO DE ACCIÓN
// ==========================================
export const ESTADOS_ACCION = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA'] as const;
export type EstadoAccion = (typeof ESTADOS_ACCION)[number];

export const ESTADO_ACCION_LABELS: Record<EstadoAccion, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada'
};

// ==========================================
// 11. NOTIFICACIONES
// ==========================================
export const TIPOS_NOTIFICACION = [
  'AVISO_INCIDENCIA',
  'CITACION',
  'ENTREVISTA',
  'CIERRE_CASO'
] as const;
export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

export const TIPO_NOTIFICACION_LABELS: Record<TipoNotificacion, string> = {
  AVISO_INCIDENCIA: 'Aviso de incidencia',
  CITACION: 'Citación',
  ENTREVISTA: 'Entrevista',
  CIERRE_CASO: 'Cierre de caso'
};

export const CANALES_NOTIFICACION = [
  'EMAIL',
  'SMS',
  'WHATSAPP',
  'LLAMADA_TELEFONICA',
  'CITACION_PRESENCIAL'
] as const;
export type CanalNotificacion = (typeof CANALES_NOTIFICACION)[number];

export const CANAL_NOTIFICACION_LABELS: Record<CanalNotificacion, string> = {
  EMAIL: 'Correo electrónico',
  SMS: 'Mensaje SMS',
  WHATSAPP: 'WhatsApp',
  LLAMADA_TELEFONICA: 'Llamada telefónica',
  CITACION_PRESENCIAL: 'Citación presencial'
};

export const ESTADOS_ENVIO = ['PENDIENTE', 'ENVIADO', 'ENTREGADO', 'FALLIDO', 'LEIDO'] as const;
export type EstadoEnvio = (typeof ESTADOS_ENVIO)[number];

export const ESTADO_ENVIO_LABELS: Record<EstadoEnvio, string> = {
  PENDIENTE: 'Pendiente',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  FALLIDO: 'Fallido',
  LEIDO: 'Leído'
};

export const ORIGENES_NOTIFICACION = ['AUTOMATICA', 'MANUAL'] as const;
export type OrigenNotificacion = (typeof ORIGENES_NOTIFICACION)[number];

// ==========================================
// 12. DERIVACIÓN (SÍSEVE)
// ==========================================
export const ESTADOS_DERIVACION = ['NO_DERIVADA', 'REGISTRADA', 'ENVIADA', 'FALLIDA'] as const;
export type EstadoDerivacion = (typeof ESTADOS_DERIVACION)[number];

export const ESTADO_DERIVACION_LABELS: Record<EstadoDerivacion, string> = {
  NO_DERIVADA: 'No derivada',
  REGISTRADA: 'Registrada en cola',
  ENVIADA: 'Enviada al SíSeVe',
  FALLIDA: 'Error de envío'
};

export const MODOS_DERIVACION = ['MANUAL', 'INTEGRADO'] as const;
export type ModoDerivacion = (typeof MODOS_DERIVACION)[number];

// ==========================================
// 13. ALERTAS
// ==========================================
export const TIPOS_ALERTA = [
  'REINCIDENCIA',
  'DEMORA_ATENCION',
  'SEGUIMIENTO_VENCIDO',
  'CASO_SIN_CIERRE'
] as const;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];

export const TIPO_ALERTA_LABELS: Record<TipoAlerta, string> = {
  REINCIDENCIA: 'Reincidencia de estudiante',
  DEMORA_ATENCION: 'Demora en la atención',
  SEGUIMIENTO_VENCIDO: 'Seguimiento vencido',
  CASO_SIN_CIERRE: 'Caso sin cierre formal'
};

export const ESTADOS_ALERTA = ['PENDIENTE', 'VISTA', 'ATENDIDA', 'DESCARTADA'] as const;
export type EstadoAlerta = (typeof ESTADOS_ALERTA)[number];

export const ESTADO_ALERTA_LABELS: Record<EstadoAlerta, string> = {
  PENDIENTE: 'Pendiente',
  VISTA: 'Vista',
  ATENDIDA: 'Atendida',
  DESCARTADA: 'Descartada'
};

// ==========================================
// 14. ROLES DE USUARIO
// ==========================================
export const ROLES_SISTEMA = [
  'ROLE_TUTOR',
  'ROLE_PSICOLOGO',
  'ROLE_ADMINISTRADOR',
  'ROLE_TRABAJADOR',
  'ROLE_INVITADO'
] as const;
export type RolNombre = (typeof ROLES_SISTEMA)[number];

export const ROL_NOMBRE_LABELS: Record<RolNombre, string> = {
  ROLE_TUTOR: 'Tutor',
  ROLE_PSICOLOGO: 'Psicólogo',
  ROLE_ADMINISTRADOR: 'Administrador',
  ROLE_TRABAJADOR: 'Personal / Docente',
  ROLE_INVITADO: 'Invitado'
};
