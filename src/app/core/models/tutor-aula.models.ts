export type Nivel = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';

/**
 * Mapeo exacto de pe.gob.minedu.sigece.dtos.tutor.TutorAulaRequestDto
 */
export interface TutorAulaRequest {
  usuarioId: number;
  nivel: Nivel;
  grado: string;
  seccion: string;
  anioEscolar?: number;
}

/**
 * Mapeo exacto de pe.gob.minedu.sigece.dtos.tutor.TutorAulaResponseDto
 */
export interface TutorAulaResponse {
  id: number;
  usuarioId: number;
  tutorNombre: string;
  tutorDni: string;
  nivel: Nivel;
  grado: string;
  seccion: string;
  anioEscolar: number;
  activo: boolean;
  createdAt: string; // OffsetDateTime serializado a ISO-8601
}

/**
 * Filtro opcional para consultar tutores por aula
 */
export interface TutorAulaFiltroAula {
  nivel: Nivel;
  grado: string;
  seccion: string;
  anioEscolar?: number;
}