import { EstadoIncidente, Gravedad } from './enums';

export type MedioOcurrencia = 'PRESENCIAL' | 'DIGITAL';
export type RolInvolucrado = 'VICTIMA' | 'AGRESOR' | 'TESTIGO';
export type TipoInvolucrado = 'ESTUDIANTE' | 'PERSONAL';
export type TipoAccion =
  | 'ENTREVISTA_ESTUDIANTE'
  | 'ENTREVISTA_PADRES'
  | 'CITACION_APODERADO'
  | 'DERIVACION_PSICOLOGIA'
  | 'MEDIDA_CORRECTIVA_FORMATIVA'
  | 'DERIVACION_DEMUNA_CEM'
  | 'ACTA_COMPROMISO'
  | 'APUNTE_INTERNO'
  | 'OTRO';
export type EstadoAccion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA';
export type TipoNotificacion = 'AVISO_INCIDENCIA' | 'CITACION' | 'INFORME_CIERRE' | 'DERIVACION';
export type OrigenNotificacion = 'MANUAL' | 'AUTOMATICA';
export type CanalNotificacion = 'WHATSAPP' | 'CORREO' | 'SMS';
export type EstadoEnvio = 'PENDIENTE' | 'ENVIADO' | 'ENTREGADO' | 'FALLIDO' | 'LEIDO';

// ==========================================
// REQUEST DTOs
// ==========================================

export interface IncidenteRequestDto {
  tipoIncidenciaId: number;
  gravedad: Gravedad;
  descripcion: string;
  lugarOcurrencia: string;
  medioOcurrencia?: MedioOcurrencia;
  fechaOcurrencia: string; // ISO OffsetDateTime
  notificarApoderado?: boolean;
}

export interface IncidenteFiltroRequestDto {
  termino?: string;
  texto?: string; // Compatibilidad con vistas previas
  estado?: EstadoIncidente | '';
  gravedad?: Gravedad | '';
  tipoIncidenciaId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  reincidencia?: boolean;
  page?: number;
  size?: number;
  pagina?: number;
  tamano?: number;
}

export interface AsignarResponsableRequestDto {
  responsableId: number;
  motivo?: string;
}

export interface CambiarEstadoRequestDto {
  nuevoEstado: EstadoIncidente;
  motivo: string;
}

export interface ClasificarGravedadRequestDto {
  gravedad: Gravedad;
  justificacion: string;
}

export interface ResolverIncidenteRequestDto {
  observaciones?: string;
}

export interface CerrarCasoRequestDto {
  actaCierre: string;
  conclusionesFinales: string;
}

export interface DerivacionSiseveRequestDto {
  codigoSiseve: string;
  fechaReporteSiseve: string;
  observacionesSiseve?: string;
}

export interface ReincidenciaRequestDto {
  estudianteId: number;
  fechaReferencia?: string;
}

export interface InvolucradoRequestDto {
  estudianteId?: number;
  usuarioId?: number;
  rolInvolucrado: RolInvolucrado;
  observaciones?: string;
}

// ==========================================
// RESPONSE DTOs
// ==========================================

export interface IncidenteResponseDto {
  id: string; // UUID
  codigoCaso: string;
  tipoIncidenciaId: number;
  tipoIncidenciaNombre: string;
  gravedad: Gravedad;
  descripcion: string;
  lugarOcurrencia: string;
  medioOcurrencia: MedioOcurrencia;
  fechaOcurrencia: string;
  fechaRegistro: string;
  estado: EstadoIncidente;
  notificarApoderado: boolean;
  reportadoPorId: number;
  reportadoPorNombre: string;
  responsableActualId?: number | null;
  responsableActualNombre?: string | null;
  fechaResolucion?: string | null;
  resueltoPorNombre?: string | null;
  actaCierre?: string | null;
  conclusionesFinales?: string | null;
  fechaCierre?: string | null;
  cerradoPorNombre?: string | null;
  reportadoSiseve: boolean;
  fechaReporteSiseve?: string | null;
  codigoSiseve?: string | null;
  observacionesSiseve?: string | null;
  derivadoPorNombre?: string | null;
  createdAt: string;
}

export interface IncidenteResumenResponseDto {
  id: string; // UUID
  codigoCaso: string;
  tipoIncidenciaNombre: string;
  tipo?: string; // Compatibilidad
  gravedad: Gravedad;
  lugarOcurrencia: string;
  fechaOcurrencia: string;
  estado: EstadoIncidente;
  responsableNombre?: string | null;
  responsable?: string | null; // Compatibilidad
  estudiantes: string[];
  reincidencia?: boolean;
}

export interface InvolucradoResponseDto {
  id: number;
  incidenteId: string;
  estudianteId?: number;
  usuarioId?: number;
  nombreCompleto: string;
  documentoIdentidad?: string;
  tipoInvolucrado: TipoInvolucrado;
  rolInvolucrado: RolInvolucrado;
  observaciones?: string;
  createdAt: string;
}

export interface AccionSeguimientoResponseDto {
  id: number;
  incidenteId: string;
  usuarioId: number;
  usuarioNombre: string;
  tipoAccion: TipoAccion;
  descripcion: string;
  fechaAccion: string;
  fechaProximaRevision?: string | null;
  estadoAccion: EstadoAccion;
  fechaCompletada?: string | null;
  createdAt: string;
}

export interface AdjuntoResponseDto {
  id: number;
  incidenteId: string;
  accionId?: number;
  subidoPorId: number;
  subidoPorNombre: string;
  nombreOriginal: string;
  descripcion: string;
  tipoMime: string;
  tamanoBytes: number;
  urlStorage?: string;
  hashSha256: string;
  activo: boolean;
  createdAt: string;
}

export interface NotificacionResponseDto {
  id: number;
  incidenteId: string;
  estudianteId?: number;
  apoderadoId?: number;
  apoderadoNombre?: string;
  accionId?: number;
  plantillaId?: number;
  enviadoPorNombre?: string;
  tipoNotificacion: TipoNotificacion;
  origen: OrigenNotificacion;
  canal: CanalNotificacion;
  destino: string;
  asunto?: string;
  mensaje?: string;
  fechaEnvio?: string;
  fechaEntrega?: string;
  estadoEnvio: EstadoEnvio;
  intentosEnvio: number;
  detalleResultado?: string;
  idTransaccionExterno?: string;
  createdAt: string;
}

export interface IncidenteExpedienteResponseDto {
  incidente: IncidenteResponseDto;
  involucrados: InvolucradoResponseDto[];
  seguimiento: AccionSeguimientoResponseDto[];
  evidencias: AdjuntoResponseDto[];
  notificaciones: NotificacionResponseDto[];
}

export interface CierreChecklistResponseDto {
  todasLasAccionesCompletadas: boolean;
  apoderadosNotificados: boolean;
  actaCierrePresente: boolean;
  cumplePlazosLegales: boolean;
  listoParaCierre: boolean;
  observacionesPendientes: string[];
}

export interface ReincidenciaResponseDto {
  estudianteId: number;
  superaUmbral: boolean;
  totalIncidentesEnPeriodo: number;
  umbralConfigurado: number;
  periodoDiasEvaluado: number;
  incidentesIds: string[];
}

export interface CasoPendienteResponseDto {
  incidenteId: string;
  codigoCaso: string;
  gravedad: Gravedad;
  estado: EstadoIncidente;
  fechaRegistro: string;
  horasSinAtencion: number;
  responsableNombre?: string;
}

// ==========================================
// ALIAS DE COMPATIBILIDAD (EVITAN TS2305)
// ==========================================
export type IncidenteFiltro = IncidenteFiltroRequestDto;
export type IncidenteResumen = IncidenteResumenResponseDto;
export type IncidenteRequest = IncidenteRequestDto;
export type IncidenteExpediente = IncidenteExpedienteResponseDto;
export type Involucrado = InvolucradoResponseDto;
export type InvolucradoRequest = InvolucradoRequestDto;
export type Adjunto = AdjuntoResponseDto;
export type CierreChecklist = CierreChecklistResponseDto;
export type AccionSeguimiento = AccionSeguimientoResponseDto;
export type Notificacion = NotificacionResponseDto;