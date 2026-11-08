import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Pagina } from '../models/api.models';
import { EstadoIncidente, Gravedad } from '../models/enums';
import {
  AsignarResponsableRequestDto,
  CambiarEstadoRequestDto,
  CasoPendienteResponseDto,
  CerrarCasoRequestDto,
  CierreChecklistResponseDto,
  ClasificarGravedadRequestDto,
  DerivacionSiseveRequestDto,
  IncidenteExpedienteResponseDto,
  IncidenteFiltroRequestDto,
  IncidenteRequestDto,
  IncidenteResponseDto,
  IncidenteResumenResponseDto,
  InvolucradoRequestDto,
  InvolucradoResponseDto,
  ReincidenciaRequestDto,
  ReincidenciaResponseDto,
  ResolverIncidenteRequestDto,
  AdjuntoResponseDto,
} from '../models/incidente.models';

@Injectable({ providedIn: 'root' })
export class IncidenteApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/incidentes`;

  /**
   * Resuelve TS2554: permite el segundo argumento opcional que envía incidencia-form.ts
   */
  registrar(dto: IncidenteRequestDto, _tipoNombre?: string): Observable<IncidenteResponseDto> {
    return this.http
      .post<ApiResponse<IncidenteResponseDto>>(this.base, dto)
      .pipe(map((r) => r.data));
  }

  obtener(incidenteId: string): Observable<IncidenteExpedienteResponseDto> {
    return this.http
      .get<ApiResponse<IncidenteExpedienteResponseDto>>(`${this.base}/${incidenteId}`)
      .pipe(map((r) => r.data));
  }

  /**
   * Resuelve TS2339: método 'listar' compatible con incidencia-list.ts
   */
  listar(filtro: IncidenteFiltroRequestDto): Observable<Pagina<IncidenteResumenResponseDto>> {
    return this.buscar(filtro);
  }

  buscar(filtro: IncidenteFiltroRequestDto): Observable<Pagina<IncidenteResumenResponseDto>> {
    let params = new HttpParams();
    const termino = filtro.termino ?? filtro.texto;
    if (termino) params = params.set('termino', termino.trim());
    if (filtro.estado) params = params.set('estado', filtro.estado);
    if (filtro.gravedad) params = params.set('gravedad', filtro.gravedad);
    if (filtro.tipoIncidenciaId) params = params.set('tipoIncidenciaId', filtro.tipoIncidenciaId.toString());
    if (filtro.fechaDesde) params = params.set('fechaDesde', filtro.fechaDesde);
    if (filtro.fechaHasta) params = params.set('fechaHasta', filtro.fechaHasta);
    if (filtro.reincidencia !== undefined && filtro.reincidencia !== null) {
      params = params.set('reincidencia', filtro.reincidencia);
    }

    const page = filtro.page ?? filtro.pagina ?? 0;
    const size = filtro.size ?? filtro.tamano ?? 10;
    params = params.set('page', page.toString()).set('size', size.toString());

    return this.http.get<ApiResponse<any>>(`${this.base}/buscar`, { params }).pipe(
      map((r) => {
        const lista: IncidenteResumenResponseDto[] = Array.isArray(r.data)
          ? r.data
          : (r.data?.content ?? []);
        return {
          content: lista.map((i) => ({
            ...i,
            tipo: i.tipo ?? i.tipoIncidenciaNombre,
            responsable: i.responsable ?? i.responsableNombre,
          })),
          totalElements: r.meta?.totalElements ?? r.data?.totalElements ?? lista.length,
        };
      })
    );
  }

  listarTodos(): Observable<IncidenteResumenResponseDto[]> {
    return this.http
      .get<ApiResponse<IncidenteResumenResponseDto[]>>(this.base)
      .pipe(map((r) => r.data ?? []));
  }

  asignarResponsable(incidenteId: string, dto: AsignarResponsableRequestDto): Observable<IncidenteResponseDto> {
    return this.http
      .patch<ApiResponse<IncidenteResponseDto>>(`${this.base}/${incidenteId}/responsable`, dto)
      .pipe(map((r) => r.data));
  }

  clasificarGravedad(incidenteId: string, gravedad: Gravedad, justificacion: string): Observable<IncidenteResponseDto> {
    const dto: ClasificarGravedadRequestDto = { gravedad, justificacion };
    return this.http
      .patch<ApiResponse<IncidenteResponseDto>>(`${this.base}/${incidenteId}/gravedad`, dto)
      .pipe(map((r) => r.data));
  }

  cambiarEstado(incidenteId: string, nuevoEstado: EstadoIncidente, motivo: string): Observable<IncidenteResponseDto> {
    const dto: CambiarEstadoRequestDto = { nuevoEstado, motivo };
    return this.http
      .patch<ApiResponse<IncidenteResponseDto>>(`${this.base}/${incidenteId}/estado`, dto)
      .pipe(map((r) => r.data));
  }

  transiciones(incidenteId: string): Observable<EstadoIncidente[]> {
    return this.http
      .get<ApiResponse<EstadoIncidente[]>>(`${this.base}/${incidenteId}/transiciones`)
      .pipe(map((r) => r.data ?? []));
  }

  resolver(incidenteId: string, observaciones?: string): Observable<IncidenteResponseDto> {
    const dto: ResolverIncidenteRequestDto = { observaciones };
    return this.http
      .post<ApiResponse<IncidenteResponseDto>>(`${this.base}/${incidenteId}/resolucion`, dto)
      .pipe(map((r) => r.data));
  }

  checklistCierre(incidenteId: string): Observable<CierreChecklistResponseDto> {
    return this.http
      .get<ApiResponse<CierreChecklistResponseDto>>(`${this.base}/${incidenteId}/cierre/checklist`)
      .pipe(map((r) => r.data));
  }

  cerrar(incidenteId: string, actaCierre: string, conclusionesFinales: string): Observable<IncidenteResponseDto> {
    const dto: CerrarCasoRequestDto = { actaCierre, conclusionesFinales };
    return this.http
      .post<ApiResponse<IncidenteResponseDto>>(`${this.base}/${incidenteId}/cierre`, dto)
      .pipe(map((r) => r.data));
  }

  derivarSiseve(
    incidenteId: string,
    codigoSiseve: string,
    fechaReporteSiseve: string,
    observacionesSiseve?: string
  ): Observable<IncidenteResponseDto> {
    const dto: DerivacionSiseveRequestDto = {
      codigoSiseve,
      fechaReporteSiseve,
      observacionesSiseve,
    };
    return this.http
      .post<ApiResponse<IncidenteResponseDto>>(`${this.base}/${incidenteId}/derivacion-siseve`, dto)
      .pipe(map((r) => r.data));
  }

  evaluarReincidencia(dto: ReincidenciaRequestDto): Observable<ReincidenciaResponseDto> {
    let params = new HttpParams().set('estudianteId', dto.estudianteId.toString());
    if (dto.fechaReferencia) {
      params = params.set('fechaReferencia', dto.fechaReferencia);
    }
    return this.http
      .get<ApiResponse<ReincidenciaResponseDto>>(`${this.base}/reincidencia`, { params })
      .pipe(map((r) => r.data));
  }

  historialPorEstudiante(estudianteId: number): Observable<IncidenteResumenResponseDto[]> {
    return this.http
      .get<ApiResponse<IncidenteResumenResponseDto[]>>(`${this.base}/estudiante/${estudianteId}/historial`)
      .pipe(map((r) => r.data ?? []));
  }

  listarPendientes(diasUmbral = 3): Observable<CasoPendienteResponseDto[]> {
    const params = new HttpParams().set('diasUmbral', diasUmbral.toString());
    return this.http
      .get<ApiResponse<CasoPendienteResponseDto[]>>(`${this.base}/pendientes`, { params })
      .pipe(map((r) => r.data ?? []));
  }

  agregarInvolucrado(incidenteId: string, dto: InvolucradoRequestDto): Observable<InvolucradoResponseDto> {
    return this.http
      .post<ApiResponse<InvolucradoResponseDto>>(`${this.base}/${incidenteId}/involucrados`, dto)
      .pipe(map((r) => r.data));
  }

  retirarInvolucrado(incidenteId: string, involucradoId: number, motivo: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/${incidenteId}/involucrados/${involucradoId}`, {
        body: { motivo },
      })
      .pipe(map(() => void 0));
  }

  subirEvidencia(incidenteId: string, archivo: File, descripcion: string): Observable<AdjuntoResponseDto> {
    const fd = new FormData();
    fd.append('datos', new Blob([JSON.stringify({ descripcion })], { type: 'application/json' }));
    fd.append('archivo', archivo);

    return this.http
      .post<ApiResponse<AdjuntoResponseDto>>(`${this.base}/${incidenteId}/adjuntos`, fd)
      .pipe(map((r) => r.data));
  }

  urlDescarga(adjuntoId: number, minutos = 15): Observable<string> {
    const params = new HttpParams().set('minutos', minutos.toString());
    return this.http
      .get<ApiResponse<{ urlDescargaTemporal: string }>>(`${environment.apiUrl}/adjuntos/${adjuntoId}/descarga`, { params })
      .pipe(map((r) => r.data.urlDescargaTemporal));
  }

  verificarIntegridad(adjuntoId: number): Observable<{ integro: boolean }> {
    return this.http
      .get<ApiResponse<{ integro: boolean }>>(`${environment.apiUrl}/adjuntos/${adjuntoId}/integridad`)
      .pipe(map((r) => r.data));
  }

  eliminarEvidencia(adjuntoId: number, motivoEliminacion: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/adjuntos/${adjuntoId}`, {
        body: { motivoEliminacion },
      })
      .pipe(map(() => void 0));
  }
}