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

@Injectable({
  providedIn: 'root'
})
export class ReporteApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/reportes';


  /**
   * Obtiene la lista de tipos de reportes preconfigurados en el sistema.
   */
  listarTipos(): Observable<TipoReporteResponse[]> {
    return this.http
      .get<ApiResponse<TipoReporteResponse[]>>(`${this.baseUrl}/tipos`)
      .pipe(map((res) => res.data));
  }

  /**
   * Genera la previsualización tabular en JSON antes de descargar el PDF/Excel.
   */
  previsualizar(filtro: ReporteFiltroRequest): Observable<ReporteResponse> {
    return this.http
      .post<ApiResponse<ReporteResponse>>(`${this.baseUrl}/previsualizar`, filtro)
      .pipe(map((res) => res.data));
  }

  /**
   * Descarga la ficha individual del expediente de un incidente.
   */
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

  /**
   * Descarga el Libro Oficial de Registro de Incidencias (D.S. N.° 004-2018-MINEDU).
   */
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

  /**
   * Descarga el padrón oficial de casos derivados a la plataforma SíSeVe.
   */
  exportarDerivacionesSiseve(formato: FormatoReporte = 'PDF'): Observable<Blob> {
    const params = new HttpParams().set('formato', formato);

    return this.ejecutarDescarga(
      `${this.baseUrl}/derivaciones-siseve`,
      params,
      `Derivaciones_Siseve.${formato.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`
    );
  }

  /**
   * Descarga el consolidado de métricas y KPIs de convivencia escolar.
   */
  exportarDashboardMetricas(formato: FormatoReporte = 'PDF'): Observable<Blob> {
    const params = new HttpParams().set('formato', formato);

    return this.ejecutarDescarga(
      `${this.baseUrl}/dashboard-metricas`,
      params,
      `Metricas_Convivencia.${formato.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`
    );
  }

  /**
   * Exportación dinámica enviando filtros avanzados vía POST.
   */
  exportarDinamico(dto: ExportarReporteRequest): Observable<Blob> {
    return this.http
      .post(`${this.baseUrl}/exportar`, dto, {
        responseType: 'blob',
        observe: 'response'
      })
      .pipe(
        tap((res: HttpResponse<Blob>) => {
          const nombreArchivo = this.extraerNombreArchivo(
            res,
            `Reporte_${dto.tipoReporte}.${dto.formato.toLowerCase() === 'pdf' ? 'pdf' : 'xlsx'}`
          );
          if (res.body) {
            this.forzarDescargaEnNavegador(res.body, nombreArchivo);
          }
        }),
        map((res) => res.body as Blob)
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

  /**
   * Extrae el nombre del archivo configurado por el backend en el header Content-Disposition.
   */
  private extraerNombreArchivo(response: HttpResponse<Blob>, fallback: string): string {
    const header = response.headers.get('content-disposition');
    if (!header) return fallback;

    // Busca: filename="mi_archivo.pdf" o filename=mi_archivo.pdf
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(header);
    if (matches != null && matches[1]) {
      return matches[1].replace(/['"]/g, '').trim();
    }
    return fallback;
  }

  /**
   * Crea un enlace <a> temporal en el DOM para abrir el diálogo nativo de descarga.
   */
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