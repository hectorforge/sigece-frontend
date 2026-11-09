// Enums del dominio SIGECE
export type FormatoReporte = 'PDF' | 'EXCEL';

export type EstadoIncidente =
  | 'REGISTRADO'
  | 'EN_INVESTIGACION'
  | 'EN_SEGUIMIENTO'
  | 'RESUELTO'
  | 'CERRADO';

export type Nivel = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';

// Wrapper genérico ApiResponse que retorna tu backend Spring Boot
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  path: string;
  traceId?: string;
}

// Catálogo de tipos de reporte
export interface TipoReporteResponse {
  codigo: string;
  nombre: string;
  descripcion: string;
  formatosSoportados: string[];
}

// Criterios de filtrado
export interface ReporteFiltroRequest {
  incidenteId?: string;
  tipoReporte?: string;
  fechaDesde?: string; // Formato 'YYYY-MM-DD'
  fechaHasta?: string; // Formato 'YYYY-MM-DD'
  nivel?: Nivel;
  grado?: string;
  estado?: EstadoIncidente;
}

// Vista previa tabular para tablas/modales
export interface ReporteResponse {
  titulo: string;
  institucion: string;
  fechaGeneracion: string;
  generadoPor: string;
  totalRegistros: number;
  filas: Record<string, unknown>[];
}

// DTO para exportaciones dinámicas
export interface ExportarReporteRequest {
  tipoReporte: string;
  formato: FormatoReporte;
  filtro: ReporteFiltroRequest;
  anonimizarDatosMenores: boolean;
}