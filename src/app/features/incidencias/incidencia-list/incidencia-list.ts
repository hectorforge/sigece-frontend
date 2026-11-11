import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu'; 
import { debounceTime, switchMap, tap } from 'rxjs';

import { 
  GRAVEDADES, 
  GRAVEDAD_LABELS, 
  ESTADOS_INCIDENTE, 
  ESTADO_INCIDENTE_LABELS 
} from '../../../core/models/enums';

import { IncidenteFiltro } from '../../../core/models/incidente.models';
import { FormatoReporte } from '../../../core/models/reporte.models';
import { IncidenteApi } from '../../../core/services/incidente-api';
import { ReporteApi } from '../../../core/services/reporte-api';
import { AlertService } from '../../../core/services/alert.service';
import { EstadoChip } from '../../../shared/estado-chip/estado-chip';
import { GravedadChip } from '../../../shared/gravedad-chip/gravedad-chip';
import { Auth } from '../../../core/auth/auth';

@Component({
  selector: 'app-incidencia-list',
  imports: [
    DatePipe,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    GravedadChip,
    EstadoChip,
  ],
  templateUrl: './incidencia-list.html',
  styleUrl: './incidencia-list.css',
})
export class IncidenciaList {
  private api = inject(IncidenteApi);
  private reporteApi = inject(ReporteApi);
  private alert = inject(AlertService);
  private router = inject(Router);
  private auth = inject(Auth);

  readonly gravedades = GRAVEDADES;
  readonly gravedadLabels = GRAVEDAD_LABELS;

  readonly estados = ESTADOS_INCIDENTE;
  readonly estadoLabels = ESTADO_INCIDENTE_LABELS;

  readonly columnas = ['codigo', 'fecha', 'estudiantes', 'tipo', 'gravedad', 'estado', 'responsable', 'alertas', 'acciones'];
  
  readonly puedeEditar = this.auth.tieneRol(['ROLE_TUTOR', 'ROLE_PSICOLOGO']);
  readonly esAdmin = this.auth.tieneRol(['ROLE_ADMINISTRADOR']);
  readonly exportandoLibro = signal(false);

  filtro = signal<IncidenteFiltro>({ texto: '', gravedad: '', estado: '', pagina: 0, tamano: 10 });
  resultado = toSignal(
    toObservable(this.filtro).pipe(
      debounceTime(300),
      switchMap(f => this.api.listar(f)),
      tap(r => console.log('Resultado del listado:', r)),
    ),
    { initialValue: null },
  );

  cambiar(parcial: Partial<IncidenteFiltro>) {
    this.filtro.update(f => ({ ...f, ...parcial, pagina: 0 }));
  }

  paginar(e: PageEvent) {
    this.filtro.update(f => ({ ...f, pagina: e.pageIndex, tamano: e.pageSize }));
  }

  abrir(id: string) { 
    this.router.navigate(['/incidencias', id]); 
  }

  exportarLibro(formato: FormatoReporte = 'PDF') {
    if (!this.esAdmin || this.exportandoLibro()) return;

    this.exportandoLibro.set(true);

    this.reporteApi.exportarLibroIncidencias(formato, false).subscribe({
      next: () => {
        this.exportandoLibro.set(false);
        this.alert.exito(
          'Libro descargado',
          `El Libro Oficial de Incidencias en ${formato} se generó correctamente.`
        );
      },
      error: (err) => {
        this.exportandoLibro.set(false);
        this.alert.error(
          err?.error?.message || `No se pudo generar el Libro de Incidencias en ${formato}.`,
          'Error al exportar'
        );
      }
    });
  }
}