import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';

import { Auth } from '../../../core/auth/auth';
import { 
  CATEGORIAS_SISEVE, 
  CATEGORIA_SISEVE_LABELS, 
  GRAVEDADES, 
  GRAVEDAD_LABELS,
  CategoriaSiseve,
  Gravedad 
} from '../../../core/models/enums';
import { 
  TipoIncidencia, 
  TipoIncidenciaFiltroRequest 
} from '../../../core/models/tipo-incidencia.models';
import { TipoIncidenciaApi } from '../../../core/services/tipo-incidencia-api';
import { AlertService } from '../../../core/services/alert.service';
import { TipoIncidenciaForm } from '../tipo-incidencia-form/tipo-incidencia-form';
import { GravedadChip } from '../../../shared/gravedad-chip/gravedad-chip';
import { ApiResponse } from '../../../core/models/api.models';

@Component({
  selector: 'app-tipo-incidencia-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    GravedadChip,
    MatTooltip
  ],
  templateUrl: './tipo-incidencia-list.html',
  styleUrl: './tipo-incidencia-list.css',
})
export class TipoIncidenciaList {
  private readonly api = inject(TipoIncidenciaApi);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(Auth);
  private readonly alert = inject(AlertService);

  readonly categorias = CATEGORIAS_SISEVE;
  readonly categoriaLabels = CATEGORIA_SISEVE_LABELS;
  readonly gravedades = GRAVEDADES;
  readonly gravedadLabels = GRAVEDAD_LABELS;
  readonly columnas = ['nombre', 'categoria', 'gravedad', 'descripcion', 'estado', 'acciones'];
  
  // Matriz: solo el Administrador edita (CU08/CU09)
  readonly puedeEditar = this.auth.tieneRol(['ROLE_ADMINISTRADOR']);

  // Filtros como signals reactivos
  texto = signal<string>('');
  categoria = signal<CategoriaSiseve | ''>('');
  gravedad = signal<Gravedad | ''>('');

  // Paginación
  pagina = signal<number>(0);
  tamanioPagina = signal<number>(10);

  // Trigger para forzar recarga (después de crear, editar o alternar estado)
  private readonly recarga = signal<number>(0);

  // Estado de carga visual
  cargando = signal<boolean>(false);

  // Flujo reactivo que combina filtros y paginación para llamar a api.buscar(...)
  resultado = toSignal(
    toObservable(
      signal({
        texto: this.texto,
        categoria: this.categoria,
        gravedad: this.gravedad,
        pagina: this.pagina,
        tamanioPagina: this.tamanioPagina,
        recarga: this.recarga
      })
    ).pipe(
      debounceTime(300),
      tap(() => this.cargando.set(true)),
      switchMap(() => {
        const filtro: TipoIncidenciaFiltroRequest = {
          termino: this.texto().trim() || null,
          categoriaSiseve: this.categoria() ? (this.categoria() as CategoriaSiseve) : null,
          gravedadBase: this.gravedad() ? (this.gravedad() as Gravedad) : null,
          page: this.pagina(),
          size: this.tamanioPagina()
        };

        return this.api.buscar(filtro).pipe(
          catchError(() => {
            this.alert.error('No se pudo cargar el catálogo de tipos de incidencia.');
            return of({ data: [], meta: { totalElements: 0, totalPages: 0, pageNumber: 0, pageSize: 10 } } as unknown as ApiResponse<TipoIncidencia[]>);
          })
        );
      }),
      tap(() => this.cargando.set(false))
    ),
    { initialValue: null }
  );


    /**
   * Obtiene la etiqueta amigable de la categoría SíSeVe con fallback seguro
   */
  obtenerCategoriaLabel(categoria: CategoriaSiseve | string | null | undefined): string {
    if (!categoria) return '—';
    return this.categoriaLabels[categoria as CategoriaSiseve] ?? categoria.replaceAll('_', ' ');
  }
  
  cambiarTexto(valor: string): void {
    this.texto.set(valor);
    this.pagina.set(0); // Reiniciar a la primera página al escribir
  }

  cambiarCategoria(valor: string): void {
    this.categoria.set(valor as CategoriaSiseve | '');
    this.pagina.set(0); // Reiniciar a la primera página al cambiar categoría
  }

  cambiarGravedad(valor: string): void {
    this.gravedad.set(valor as Gravedad | '');
    this.pagina.set(0); // Reiniciar a la primera página al cambiar gravedad
  }

  paginar(e: PageEvent): void {
    this.pagina.set(e.pageIndex);
    this.tamanioPagina.set(e.pageSize);
  }

  abrirForm(tipo: TipoIncidencia | null): void {
    this.dialog
      .open(TipoIncidenciaForm, { width: '560px', data: tipo })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.recarga.update((n) => n + 1);
        }
      });
  }

  async alternar(t: TipoIncidencia): Promise<void> {
    const accion = t.activo ? 'desactivar' : 'reactivar';

    // Confirmación modal con AlertService (SweetAlert2)
    const confirmado = t.activo
      ? await this.alert.confirmarPeligro(
          `¿Desactivar tipo "${t.nombre}"?`,
          'El tipo ya no estará disponible para registrar nuevos incidentes, pero se conservará en el historial.',
          'Sí, desactivar'
        )
      : await this.alert.confirmar(
          `¿Reactivar tipo "${t.nombre}"?`,
          'El tipo volverá a estar habilitado para la clasificación de incidencias.',
          'Sí, reactivar'
        );

    if (!confirmado) return;

    const req$ = t.activo ? this.api.desactivar(t.id) : this.api.reactivar(t.id);

    req$.subscribe({
      next: () => {
        this.alert.exito(
          t.activo ? 'Tipo desactivado' : 'Tipo reactivado',
          `"${t.nombre}" fue ${t.activo ? 'desactivado' : 'reactivado'} correctamente.`
        );
        this.recarga.update((n) => n + 1);
      },
      error: (err) => {
        const errorMsg =
          err?.error?.message ??
          err?.error?.mensaje ??
          err?.message ??
          `No se pudo ${accion} el tipo de incidencia.`;

        this.alert.error(errorMsg, 'Error al cambiar estado');
      },
    });
  }
}