import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import {
  Nivel,
  TutorAulaRequest,
  TutorAulaResponse,
} from '../models/tutor-aula.models';

@Injectable({ providedIn: 'root' })
export class TutorAulaApi {
  private readonly http = inject(HttpClient);
  // CORRECCIÓN: 'tutor-aulas' para coincidir con @RequestMapping("/api/v1/tutor-aulas")
  private readonly base = `${environment.apiUrl}/tutor-aulas`;

  /**
   * POST /api/v1/tutor-aulas
   * Asigna un aula a un tutor (Rol: ADMINISTRADOR).
   */
  asignarAula(dto: TutorAulaRequest): Observable<TutorAulaResponse> {
    return this.http
      .post<ApiResponse<TutorAulaResponse>>(this.base, dto)
      .pipe(map((r) => r.data));
  }

  /**
   * GET /api/v1/tutor-aulas/tutor/{usuarioId}?anioEscolar={anioEscolar}
   * Lista las asignaciones de aulas que tiene un tutor.
   */
  listarPorTutor(usuarioId: number, anioEscolar?: number): Observable<TutorAulaResponse[]> {
    let params = new HttpParams();
    if (anioEscolar !== undefined && anioEscolar !== null) {
      params = params.set('anioEscolar', anioEscolar.toString());
    }

    return this.http
      .get<ApiResponse<TutorAulaResponse[]>>(`${this.base}/tutor/${usuarioId}`, { params })
      .pipe(map((r) => r.data ?? []));
  }

  /**
   * GET /api/v1/tutor-aulas/aula?nivel={nivel}&grado={grado}&seccion={seccion}&anioEscolar={anioEscolar}
   * Lista los tutores asignados a un aula según nivel, grado, sección y año escolar.
   */
  listarTutoresPorAula(
    nivel: Nivel,
    grado: string,
    seccion: string,
    anioEscolar?: number
  ): Observable<TutorAulaResponse[]> {
    let params = new HttpParams()
      .set('nivel', nivel)
      .set('grado', grado.trim())
      .set('seccion', seccion.trim());

    if (anioEscolar !== undefined && anioEscolar !== null) {
      params = params.set('anioEscolar', anioEscolar.toString());
    }

    return this.http
      .get<ApiResponse<TutorAulaResponse[]>>(`${this.base}/aula`, { params })
      .pipe(map((r) => r.data ?? []));
  }

  /**
   * PATCH /api/v1/tutor-aulas/{tutorAulaId}/desactivar
   * Desactiva la asignación del tutor en el aula (Rol: ADMINISTRADOR).
   */
  desactivar(tutorAulaId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/${tutorAulaId}/desactivar`, {})
      .pipe(map(() => void 0));
  }

  /**
   * PATCH /api/v1/tutor-aulas/{tutorAulaId}/reactivar
   * Reactiva la asignación del tutor en el aula (Rol: ADMINISTRADOR).
   */
  reactivar(tutorAulaId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/${tutorAulaId}/reactivar`, {})
      .pipe(map(() => void 0));
  }
}