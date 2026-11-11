import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ApiResponse,
  TipoReporteResponse,
  ReporteResponse,
  ReporteFiltroRequest,
  ExportarReporteRequest,
  FormatoReporte
} from '../models/reporte.models';
import { DashboardFiltro } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class ReporteApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/reportes';

  listarTipos(): Observable<TipoReporteResponse[]> {
    return this.http
      .get<ApiResponse<TipoReporteResponse[]>>(`${this.baseUrl}/tipos`)
      .pipe(map((res) => res.data));
  }

  previsualizar(filtro: ReporteFiltroRequest): Observable<ReporteResponse> {
    return this.http
      .post<ApiResponse<ReporteResponse>>(`${this.baseUrl}/previsualizar`, filtro)
      .pipe(map((res) => res.data));
  }

  exportarExpediente(
    incidenteId: string,
    formato: FormatoReporte = 'PDF',
    anonimizar: boolean = false
  ): Observable<Blob> {
    const params = new HttpParams()
      .set('formato', formato)
      .set('anonimizar', anonimizar.toString());

    return this.ejecutarDescarga(
      `${this.baseUrl}/expedientes/${incidenteId}`,
      params,
      `Expediente_${incidenteId}.${formato.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`
    );
  }

  exportarLibroIncidencias(
    formato: FormatoReporte = 'PDF',
    anonimizar: boolean = false
  ): Observable<Blob> {
    const params = new HttpParams()
      .set('formato', formato)
      .set('anonimizar', anonimizar.toString());

    return this.ejecutarDescarga(
      `${this.baseUrl}/libro-incidencias`,
      params,
      `Libro_Incidencias.${formato.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`
    );
  }

  exportarDerivacionesSiseve(formato: FormatoReporte = 'PDF'): Observable<Blob> {
    const params = new HttpParams().set('formato', formato);

    return this.ejecutarDescarga(
      `${this.baseUrl}/derivaciones-siseve`,
      params,
      `Derivaciones_Siseve.${formato.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`
    );
  }

  /**
   * Descarga el consolidado de métricas y KPIs aplicando los filtros del dashboard.
   */
  exportarDashboardMetricas(formato: FormatoReporte = 'PDF', filtro?: DashboardFiltro): Observable<Blob> {
    let params = new HttpParams().set('formato', formato);

    if (filtro) {
      if (filtro.fechaDesde?.trim()) {
        params = params.set('fechaDesde', filtro.fechaDesde.trim());
      }
      if (filtro.fechaHasta?.trim()) {
        params = params.set('fechaHasta', filtro.fechaHasta.trim());
      }
      if (filtro.nivel && filtro.nivel.trim() !== '') {
        params = params.set('nivel', filtro.nivel.trim());
      }
      if (filtro.grado && filtro.grado.trim() !== '') {
        params = params.set('grado', filtro.grado.trim());
      }
    }

    return this.ejecutarDescarga(
      `${this.baseUrl}/dashboard-metricas`,
      params,
      `Metricas_Convivencia.${formato.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`
    );
  }

  private ejecutarDescarga(
    url: string,
    params: HttpParams,
    nombrePorDefecto: string
  ): Observable<Blob> {
    return this.http
      .get(url, {
        params,
        responseType: 'blob',
        observe: 'response'
      })
      .pipe(
        tap((res: HttpResponse<Blob>) => {
          const nombre = this.extraerNombreArchivo(res, nombrePorDefecto);
          if (res.body) {
            this.forzarDescargaEnNavegador(res.body, nombre);
          }
        }),
        map((res) => res.body as Blob)
      );
  }

  private extraerNombreArchivo(response: HttpResponse<Blob>, fallback: string): string {
    const header = response.headers.get('content-disposition');
    if (!header) return fallback;

    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(header);
    if (matches != null && matches[1]) {
      return matches[1].replace(/['"]/g, '').trim();
    }
    return fallback;
  }

  public forzarDescargaEnNavegador(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = nombreArchivo;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}