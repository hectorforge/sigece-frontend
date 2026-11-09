import { Nivel } from './enums'; // O export type Nivel = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';

/**
 * Mapeo exacto de pe.gob.minedu.sigece.dtos.aula.AulaRequestDto
 * Payload para crear una nueva aula física en un año escolar determinado.
 */
export interface AulaRequest {
  nivel: Nivel;
  grado: string;
  seccion: string;
  anioEscolar?: number;
  tutorId?: number | null;
}

/**
 * Mapeo exacto de pe.gob.minedu.sigece.dtos.aula.AsignarTutorRequestDto
 * Payload para asignar o reasignar un docente con rol TUTOR a un aula existente.
 */
export interface AsignarTutorRequest {
  tutorId: number;
}

/**
 * Mapeo exacto de pe.gob.minedu.sigece.dtos.aula.AulaFiltroRequestDto
 * Parámetros de consulta y paginación para la búsqueda avanzada de aulas.
 */
export interface AulaFiltro {
  termino?: string;
  nivel?: Nivel | '';
  grado?: string;
  seccion?: string;
  anioEscolar?: number;
  tutorId?: number;
  soloSinTutor?: boolean;
  activo?: boolean | '';
  page: number;
  size: number;
}

/**
 * Mapeo exacto de pe.gob.minedu.sigece.dtos.aula.AulaResponseDto
 * Representación completa del aula y los datos del tutor asignado (si tuviera).
 */
export interface AulaResponse {
  id: number;
  nivel: Nivel;
  grado: string;
  seccion: string;
  anioEscolar: number;
  tutorId: number | null;
  tutorNombreCompleto: string | null;
  tutorDni: string | null;
  activo: boolean;
  createdAt: string; // ISO-8601 (OffsetDateTime)
  updatedAt: string; // ISO-8601 (OffsetDateTime)
}

export type AulaResponseDto = AulaResponse;
export type AulaRequestDto = AulaRequest;
export type AsignarTutorRequestDto = AsignarTutorRequest;
export type AulaFiltroRequestDto = AulaFiltro;