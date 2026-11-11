import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.models';
import { 
  TipoIncidencia, 
  TipoIncidenciaRequest, 
  TipoIncidenciaResponse, 
  TipoIncidenciaFiltroRequest 
} from '../models/tipo-incidencia.models';
import { CategoriaSiseve } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class TipoIncidenciaApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tipos-incidencia`;

  /**
   * Búsqueda paginada con todos los filtros disponibles
   */
  buscar(filtro?: TipoIncidenciaFiltroRequest): Observable<ApiResponse<TipoIncidenciaResponse[]>> {
    let params = new HttpParams();

    if (filtro) {
      if (filtro.termino && filtro.termino.trim() !== '') {
        params = params.set('termino', filtro.termino.trim());
      }
      if (filtro.categoriaSiseve) {
        params = params.set('categoriaSiseve', filtro.categoriaSiseve);
      }
      if (filtro.gravedadBase) {
        params = params.set('gravedadBase', filtro.gravedadBase);
      }
      if (filtro.page !== undefined && filtro.page !== null) {
        params = params.set('page', filtro.page.toString());
      }
      if (filtro.size !== undefined && filtro.size !== null) {
        params = params.set('size', filtro.size.toString());
      }
    }

    return this.http.get<ApiResponse<TipoIncidenciaResponse[]>>(`${this.base}/buscar`, { params });
  }

  obtenerPorId(id: number): Observable<TipoIncidenciaResponse> {
    return this.http.get<ApiResponse<TipoIncidenciaResponse>>(`${this.base}/${id}`).pipe(
      map(r => r.data!)
    );
  }

  listarTodos(): Observable<TipoIncidenciaResponse[]> {
    return this.http.get<ApiResponse<TipoIncidenciaResponse[]>>(this.base).pipe(
      map(r => r.data ?? [])
    );
  }

  listarActivos(): Observable<TipoIncidenciaResponse[]> {
    return this.http.get<ApiResponse<TipoIncidenciaResponse[]>>(`${this.base}/activos`).pipe(
      map(r => r.data ?? [])
    );
  }

  listarPorCategoriaSiseve(categoria: CategoriaSiseve): Observable<TipoIncidenciaResponse[]> {
    return this.http.get<ApiResponse<TipoIncidenciaResponse[]>>(`${this.base}/categoria/${categoria}`).pipe(
      map(r => r.data ?? [])
    );
  }

  crear(dto: TipoIncidenciaRequest): Observable<TipoIncidenciaResponse> {
    return this.http.post<ApiResponse<TipoIncidenciaResponse>>(this.base, dto).pipe(
      map(r => r.data!)
    );
  }

  actualizar(id: number, dto: TipoIncidenciaRequest): Observable<TipoIncidenciaResponse> {
    return this.http.put<ApiResponse<TipoIncidenciaResponse>>(`${this.base}/${id}`, dto).pipe(
      map(r => r.data!)
    );
  }

  desactivar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/desactivar`, {});
  }

  reactivar(id: number): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/${id}/reactivar`, {});
  }
}