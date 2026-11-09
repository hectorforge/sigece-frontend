import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginationMeta } from '../models/api.models';
import {
  AsignarTutorRequest,
  AulaFiltro,
  AulaRequest,
  AulaResponse,
} from '../models/aula.models';

export interface PagedAulaResult {
  content: AulaResponse[];
  meta?: PaginationMeta;
  totalElements: number;
}

@Injectable({ providedIn: 'root' })
export class AulaApi {
  private readonly http = inject(HttpClient);
  // Recurso RESTful oficial mapeado a @RequestMapping("/api/v1/aulas")
  private readonly base = `${environment.apiUrl}/aulas`;

  /**
   * POST /api/v1/aulas
   * Registra una nueva aula física (Rol: ADMINISTRADOR).
   */
  registrarAula(dto: AulaRequest): Observable<AulaResponse> {
    return this.http
      .post<ApiResponse<AulaResponse>>(this.base, dto)
      .pipe(map((r) => r.data));
  }

  /**
   * PUT /api/v1/aulas/{aulaId}/tutor
   * Asigna o cambia el docente tutor a un aula existente (Rol: ADMINISTRADOR).
   */
  asignarTutor(aulaId: number, dto: AsignarTutorRequest): Observable<AulaResponse> {
    return this.http
      .put<ApiResponse<AulaResponse>>(`${this.base}/${aulaId}/tutor`, dto)
      .pipe(map((r) => r.data));
  }

  /**
   * DELETE /api/v1/aulas/{aulaId}/tutor
   * Desasigna el tutor del aula dejándola vacante (Rol: ADMINISTRADOR).
   */
  desasignarTutor(aulaId: number): Observable<AulaResponse> {
    return this.http
      .delete<ApiResponse<AulaResponse>>(`${this.base}/${aulaId}/tutor`)
      .pipe(map((r) => r.data));
  }

  /**
   * GET /api/v1/aulas/{aulaId}
   * Obtiene la información detallada de un aula por su identificador único.
   */
  obtenerPorId(aulaId: number): Observable<AulaResponse> {
    return this.http
      .get<ApiResponse<AulaResponse>>(`${this.base}/${aulaId}`)
      .pipe(map((r) => r.data));
  }

  /**
   * GET /api/v1/aulas
   * Búsqueda paginada con filtros múltiples (nivel, grado, sección, año, con/sin tutor, etc.).
   */
  buscarAulas(filtro?: Partial<AulaFiltro>): Observable<PagedAulaResult> {
    let params = new HttpParams();

    if (filtro) {
      if (filtro.termino?.trim()) {
        params = params.set('termino', filtro.termino.trim());
      }
      if (filtro.nivel) {
        params = params.set('nivel', filtro.nivel);
      }
      if (filtro.grado?.trim()) {
        params = params.set('grado', filtro.grado.trim());
      }
      if (filtro.seccion?.trim()) {
        params = params.set('seccion', filtro.seccion.trim().toUpperCase());
      }
      if (filtro.anioEscolar !== undefined && filtro.anioEscolar !== null) {
        params = params.set('anioEscolar', filtro.anioEscolar.toString());
      }
      if (filtro.tutorId !== undefined && filtro.tutorId !== null) {
        params = params.set('tutorId', filtro.tutorId.toString());
      }
      if (filtro.soloSinTutor !== undefined && filtro.soloSinTutor !== null) {
        params = params.set('soloSinTutor', filtro.soloSinTutor.toString());
      }
      if (filtro.activo !== undefined && filtro.activo !== '') {
        params = params.set('activo', filtro.activo.toString());
      }
      if (filtro.page !== undefined && filtro.page !== null) {
        params = params.set('page', filtro.page.toString());
      }
      if (filtro.size !== undefined && filtro.size !== null) {
        params = params.set('size', filtro.size.toString());
      }
    }

    return this.http
      .get<ApiResponse<AulaResponse[]>>(this.base, { params })
      .pipe(
        map((r) => ({
          content: r.data ?? [],
          meta: r.meta,
          totalElements: r.meta?.totalElements ?? (r.data ?? []).length,
        }))
      );
  }

  /**
   * GET /api/v1/aulas/tutor/{tutorId}
   * Lista paginada de las aulas a cargo de un docente tutor específico.
   */
  listarPorTutor(
    tutorId: number,
    anioEscolar?: number,
    page: number = 0,
    size: number = 10
  ): Observable<PagedAulaResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (anioEscolar !== undefined && anioEscolar !== null) {
      params = params.set('anioEscolar', anioEscolar.toString());
    }

    return this.http
      .get<ApiResponse<AulaResponse[]>>(`${this.base}/tutor/${tutorId}`, { params })
      .pipe(
        map((r) => ({
          content: r.data ?? [],
          meta: r.meta,
          totalElements: r.meta?.totalElements ?? (r.data ?? []).length,
        }))
      );
  }

  /**
   * GET /api/v1/aulas/opciones?anioEscolar={anioEscolar}
   * Listado liviano sin paginación para selectores/comboboxes (ej. formulario de estudiantes).
   */
  listarOpcionesActivas(anioEscolar?: number): Observable<AulaResponse[]> {
    let params = new HttpParams();
    if (anioEscolar !== undefined && anioEscolar !== null) {
      params = params.set('anioEscolar', anioEscolar.toString());
    }

    return this.http
      .get<ApiResponse<AulaResponse[]>>(`${this.base}/opciones`, { params })
      .pipe(map((r) => r.data ?? []));
  }

  /**
   * PATCH /api/v1/aulas/{aulaId}/desactivar
   * Da de baja lógica a un aula (Rol: ADMINISTRADOR).
   */
  desactivar(aulaId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/${aulaId}/desactivar`, {})
      .pipe(map(() => void 0));
  }

  /**
   * PATCH /api/v1/aulas/{aulaId}/reactivar
   * Reactiva un aula previamente dada de baja (Rol: ADMINISTRADOR).
   */
  reactivar(aulaId: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/${aulaId}/reactivar`, {})
      .pipe(map(() => void 0));
  }
}