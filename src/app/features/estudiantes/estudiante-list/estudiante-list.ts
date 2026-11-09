import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, of, switchMap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Auth } from '../../../core/auth/auth';
import { Nivel, NIVELES } from '../../../core/models/enums';
import { Estudiante, EstudianteFiltro } from '../../../core/models/estudiante.models';
import { EstudianteApi } from '../../../core/services/estudiante-api';
import { AlertService } from '../../../core/services/alert.service';
import { EstudianteForm } from '../estudiante-form/estudiante-form';
import { AsignarAulaDialog } from '../asignar-aula-dialog/asignar-aula-dialog';

@Component({
  selector: 'app-estudiante-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './estudiante-list.html',
  styleUrl: './estudiante-list.css',
})
export class EstudianteList {
  private readonly api = inject(EstudianteApi);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(Auth);
  private readonly alert = inject(AlertService);

  readonly anioActual = new Date().getFullYear();
  readonly niveles: readonly Nivel[] = NIVELES;
  readonly columnas = ['codigo', 'nombre', 'aula', 'estado', 'acciones'];

  readonly puedeEditar = this.auth.tieneRol(['ROLE_ADMINISTRADOR']);
  readonly soloSusAulas = this.auth.tieneRol(['ROLE_TUTOR']);

  // Filtros completos según EstudianteFiltroRequestDto
  filtro = signal<EstudianteFiltro>({
    termino: '',
    nivel: '',
    grado: '',
    seccion: '',
    anioEscolar: this.anioActual,
    activo: true,
    page: 0,
    size: 10,
  });

  private recarga = signal(0);

  resultado = toSignal(
    combineLatest([toObservable(this.filtro), toObservable(this.recarga)]).pipe(
      switchMap(([f]) =>
        this.api.buscar(f).pipe(
          catchError(() => {
            this.alert.error('No se pudo cargar la lista de estudiantes.');
            return of({ content: [], totalElements: 0 });
          })
        )
      )
    ),
    { initialValue: null }
  );

  cambiar(parcial: Partial<EstudianteFiltro>): void {
    this.filtro.update((f) => ({ ...f, ...parcial, page: 0 }));
  }

  limpiarFiltros(): void {
    this.filtro.set({
      termino: '',
      nivel: '',
      grado: '',
      seccion: '',
      anioEscolar: this.anioActual,
      activo: true,
      page: 0,
      size: 10,
    });
  }

  paginar(e: PageEvent): void {
    this.filtro.update((f) => ({ ...f, page: e.pageIndex, size: e.pageSize }));
  }

  abrirForm(est: Estudiante | null): void {
    this.dialog
      .open(EstudianteForm, { width: '560px', data: est })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.recarga.update((n) => n + 1);
      });
  }

  abrirAsignarAula(est: Estudiante): void {
    this.dialog
      .open(AsignarAulaDialog, { width: '480px', data: est })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.recarga.update((n) => n + 1);
      });
  }

  async alternar(e: Estudiante): Promise<void> {
    const accion = e.activo ? 'desactivar' : 'reactivar';
    const nombreCompleto = `${e.nombres} ${e.apellidos}`;

    const confirmado = e.activo
      ? await this.alert.confirmarPeligro(
          `¿Deseas desactivar a ${nombreCompleto}?`,
          'El estudiante quedará inactivo en el padrón escolar.',
          'Sí, desactivar'
        )
      : await this.alert.confirmar(
          `¿Deseas reactivar a ${nombreCompleto}?`,
          'El estudiante volverá a figurar activo en el padrón.',
          'Sí, reactivar'
        );

    if (!confirmado) return;

    const req$ = e.activo ? this.api.desactivar(e.id) : this.api.reactivar(e.id);

    req$.subscribe({
      next: () => {
        this.alert.exito(
          e.activo ? 'Estudiante desactivado' : 'Estudiante reactivado',
          `${nombreCompleto} fue ${e.activo ? 'desactivado' : 'reactivado'} correctamente.`
        );
        this.recarga.update((n) => n + 1);
      },
      error: (err) => {
        this.alert.error(err?.error?.message ?? `No se pudo ${accion} al estudiante.`);
      },
    });
  }

  async eliminar(e: Estudiante): Promise<void> {
    const nombreCompleto = `${e.nombres} ${e.apellidos}`;

    const confirmado = await this.alert.confirmarPeligro(
      `¿Deseas eliminar a ${nombreCompleto}?`,
      'El estudiante será retirado del padrón institucional. Esta acción no se puede deshacer.',
      'Sí, eliminar'
    );

    if (!confirmado) return;

    this.api.eliminar(e.id).subscribe({
      next: () => {
        this.alert.exito(
          'Estudiante eliminado',
          `${nombreCompleto} fue eliminado del padrón correctamente.`
        );
        this.recarga.update((n) => n + 1);
      },
      error: (err) => {
        this.alert.error(err?.error?.message ?? 'No se pudo eliminar al estudiante.');
      },
    });
  }
}