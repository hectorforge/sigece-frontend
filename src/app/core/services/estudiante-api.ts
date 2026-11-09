import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Pagina } from '../models/api.models';
import { AsignarApoderadoRequest, VinculoFamiliar } from '../models/apoderado.models';
import {
  Estudiante,
  EstudianteFiltro,
  EstudianteRequest,
  PerfilEstudiante,
} from '../models/estudiante.models';

@Injectable({ providedIn: 'root' })
export class EstudianteApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/estudiantes`;

  /**
   * POST /api/v1/estudiantes
   * Registra un nuevo estudiante vinculado a su aula (Rol: ADMINISTRADOR).
   */
  registrar(dto: EstudianteRequest): Observable<Estudiante> {
    return this.http
      .post<ApiResponse<Estudiante>>(this.base, dto)
      .pipe(map((r) => r.data));
  }

  /**
   * PUT /api/v1/estudiantes/{id}
   * Actualiza los datos personales y/o aula del estudiante (Rol: ADMINISTRADOR).
   */
  actualizar(id: number, dto: EstudianteRequest): Observable<Estudiante> {
    return this.http
      .put<ApiResponse<Estudiante>>(`${this.base}/${id}`, dto)
      .pipe(map((r) => r.data));
  }

  /**
   * GET /api/v1/estudiantes/{id}
   * Obtiene los datos de un estudiante por su ID primario.
   */
  obtenerPorId(id: number): Observable<Estudiante> {
    return this.http
      .get<ApiResponse<Estudiante>>(`${this.base}/${id}`)
      .pipe(map((r) => r.data));
  }

  /**
   * GET /api/v1/estudiantes/siagie/{codigoSiagie}
   * Consulta un estudiante por su código oficial de matrícula SIAGIE.
   */
  obtenerPorCodigoSiagie(codigoSiagie: string): Observable<Estudiante> {
    return this.http
      .get<ApiResponse<Estudiante>>(`${this.base}/siagie/${codigoSiagie.trim()}`)
      .pipe(map((r) => r.data));
  }

  /**
   * GET /api/v1/estudiantes/{id}/perfil
   * Obtiene la ficha integral del estudiante (datos, apoderados e histórico de incidencias).
   */
  obtenerPerfil(id: number): Observable<PerfilEstudiante> {
    return this.http
      .get<ApiResponse<PerfilEstudiante>>(`${this.base}/${id}/perfil`)
      .pipe(map((r) => r.data));
  }

  /** Alias para mantener compatibilidad con vistas previas */
  perfil(id: number): Observable<PerfilEstudiante> {
    return this.obtenerPerfil(id);
  }

  /**
   * GET /api/v1/estudiantes (o /buscar)
   * Búsqueda paginada con filtros: término, aulaId, nivel, grado, sección, año escolar y estado activo.
   */
  buscar(f: Partial<EstudianteFiltro> = {}): Observable<Pagina<Estudiante>> {
    let params = new HttpParams()
      .set('page', (f.page ?? 0).toString())
      .set('size', (f.size ?? 10).toString());

    if (f.termino?.trim()) {
      params = params.set('termino', f.termino.trim());
    }
    if (f.aulaId !== undefined && f.aulaId !== null && f.aulaId !== '') {
      params = params.set('aulaId', f.aulaId.toString());
    }
    if (f.nivel) {
      params = params.set('nivel', f.nivel);
    }
    if (f.grado?.trim()) {
      params = params.set('grado', f.grado.trim());
    }
    if (f.seccion?.trim()) {
      params = params.set('seccion', f.seccion.trim().toUpperCase());
    }
    if (f.anioEscolar !== undefined && f.anioEscolar !== null && f.anioEscolar !== '') {
      params = params.set('anioEscolar', f.anioEscolar.toString());
    }
    if (f.activo !== undefined && f.activo !== null && f.activo !== '') {
      params = params.set('activo', f.activo.toString());
    }

    return this.http
      .get<ApiResponse<Estudiante[]>>(`${this.base}/buscar`, { params })
      .pipe(
        map((r) => {
          const lista = Array.isArray(r.data)
            ? r.data
            : ((r.data as any)?.content ?? []);

          const total =
            r.meta?.totalElements ??
            (r.data as any)?.totalElements ??
            lista.length;

          return { content: lista, totalElements: total };
        })
      );
  }

  /**
   * PATCH /api/v1/estudiantes/{id}/desactivar
   */
  desactivar(id: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/${id}/desactivar`, {})
      .pipe(map(() => void 0));
  }

  /**
   * PATCH /api/v1/estudiantes/{id}/reactivar
   */
  reactivar(id: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.base}/${id}/reactivar`, {})
      .pipe(map(() => void 0));
  }

  /**
   * DELETE /api/v1/estudiantes/{id}
   * Borrado lógico del estudiante (Rol: ADMINISTRADOR).
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // =========================================================================
  // 5. GESTIÓN DE APODERADOS Y CONTEOS
  // =========================================================================

  /**
   * POST /api/v1/estudiantes/{id}/apoderados
   * Asigna un apoderado legal al estudiante definiendo parentesco y si es contacto principal.
   */
  asignarApoderado(id: number, dto: AsignarApoderadoRequest): Observable<VinculoFamiliar> {
    return this.http
      .post<ApiResponse<VinculoFamiliar>>(`${this.base}/${id}/apoderados`, dto)
      .pipe(map((r) => r.data));
  }

  /**
   * DELETE /api/v1/estudiantes/{id}/apoderados/{apoderadoId}
   * Desvincula un apoderado del estudiante.
   */
  desasignarApoderado(id: number, apoderadoId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/${id}/apoderados/${apoderadoId}`)
      .pipe(map(() => void 0));
  }

  /**
   * GET /api/v1/estudiantes/{id}/incidentes/conteo
   * Cuenta la cantidad de incidencias en las que el estudiante estuvo involucrado.
   */
  contarIncidentesAsociados(id: number): Observable<number> {
    return this.http
      .get<ApiResponse<number>>(`${this.base}/${id}/incidentes/conteo`)
      .pipe(map((r) => r.data ?? 0));
  }
}