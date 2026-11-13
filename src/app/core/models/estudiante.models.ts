import { Nivel } from './enums';
import { VinculoFamiliar } from './apoderado.models';

export interface EstudianteRequest {
  codigoSiagie: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string; 
  aulaId: number;          
}

export interface EstudianteResumen {
  id: number;
  codigoSiagie: string;
  nombres: string;
  apellidos: string;
}

export interface Estudiante {
  id: number;
  codigoSiagie: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  aulaId: number;
  nivel: Nivel;
  grado: string;
  seccion: string;
  anioEscolar: number;
  activo: boolean;
  createdAt?: string;
}

export interface EstudianteFiltro {
  termino: string;
  aulaId?: number | '';
  nivel: Nivel | '';
  grado?: string;
  seccion?: string;
  anioEscolar?: number | '';
  activo: boolean | '';
  page: number;
  size: number;
}

export interface PerfilEstudiante {
  estudiante: Estudiante;
  apoderados: VinculoFamiliar[];
  totalIncidentesHistoricos: number;
  ultimosIncidentes: unknown[];
}