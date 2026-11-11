import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { Auth } from '../../../core/auth/auth';
import { CATEGORIAS_SISEVE } from '../../../core/models/enums';
import { TipoIncidencia } from '../../../core/models/tipo-incidencia.models';
import { TipoIncidenciaApi } from '../../../core/services/tipo-incidencia-api';
import { AlertService } from '../../../core/services/alert.service';
import { TipoIncidenciaForm } from '../tipo-incidencia-form/tipo-incidencia-form';
import { GravedadChip } from '../../../shared/gravedad-chip/gravedad-chip';
import { MatTooltip } from '@angular/material/tooltip';

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
  readonly columnas = ['nombre', 'categoria', 'gravedad', 'descripcion', 'estado', 'acciones'];
  
  // Matriz: solo el Administrador edita (CU08/CU09)
  readonly puedeEditar = this.auth.tieneRol(['ROLE_ADMINISTRADOR']);

  // Filtros
  texto = signal('');
  categoria = signal('');

  // Paginación visual en el cliente
  pagina = signal(0);
  tamanioPagina = signal(10);

  private readonly recarga = signal(0);

  // Obtención completa de datos desde el backend
  datos = toSignal(
    toObservable(this.recarga).pipe(
      switchMap(() =>
        this.api.listarTodos().pipe(
          catchError(() => {
            this.alert.error('No se pudo cargar el catálogo de tipos de incidencia.');
            return of([] as TipoIncidencia[]);
          })
        )
      )
    ),
    { initialValue: null }
  );

  // 1. Filtrado en memoria
  filtrados = computed(() => {
    const t = this.texto().toLowerCase().trim();
    const c = this.categoria();

    return (this.datos() ?? []).filter(
      (x) =>
        (!t || x.nombre.toLowerCase().includes(t) || (x.descripcion ?? '').toLowerCase().includes(t)) &&
        (!c || x.categoriaSiseve === c)
    );
  });

  // 2. Paginación visual sobre los elementos filtrados
  paginados = computed(() => {
    const inicio = this.pagina() * this.tamanioPagina();
    return this.filtrados().slice(inicio, inicio + this.tamanioPagina());
  });

  cambiarTexto(valor: string): void {
    this.texto.set(valor);
    this.pagina.set(0); // Reiniciar a la primera página al escribir
  }

  cambiarCategoria(valor: string): void {
    this.categoria.set(valor);
    this.pagina.set(0); // Reiniciar a la primera página al cambiar categoría
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