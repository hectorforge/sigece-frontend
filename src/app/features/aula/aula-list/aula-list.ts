import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, of, switchMap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { Auth } from '../../../core/auth/auth';
import { AlertService } from '../../../core/services/alert.service';
import { AulaApi, PagedAulaResult } from '../../../core/services/aula-api';
import { AulaForm } from '../aula-form/aula-form';
import { AsignarTutorAula } from '../asignar-tutor-aula/asignar-tutor-aula';
import { Nivel } from '../../../core/models/enums';
import { AulaFiltro, AulaResponseDto } from '../../../core/models/aula.models';

@Component({
  selector: 'app-aula-list',
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
  ],
  templateUrl: './aula-list.html',
  styleUrl: './aula-list.css',
})
export class AulaList {
  private readonly api = inject(AulaApi);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(Auth);
  private readonly alert = inject(AlertService);

  readonly anioActual = new Date().getFullYear();
  readonly niveles: Nivel[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  readonly columnas = ['aula', 'anio', 'tutor', 'estado', 'acciones'];

  // Permisos administrativos
  readonly puedeEditar = this.auth.tieneRol(['ROLE_ADMINISTRADOR']);

  filtro = signal<AulaFiltro>({
    termino: '',
    nivel: '',
    anioEscolar: this.anioActual,
    soloSinTutor: false,
    activo: true,
    page: 0,
    size: 10,
  });

  private recarga = signal(0);

  resultado = toSignal(
    combineLatest([toObservable(this.filtro), toObservable(this.recarga)]).pipe(
      switchMap(([f]) =>
        this.api.buscarAulas(f).pipe(
          catchError(() => {
            this.alert.error('No se pudo cargar la lista de aulas.');
            return of({ content: [], totalElements: 0 } as PagedAulaResult);
          })
        )
      )
    ),
    { initialValue: { content: [], totalElements: 0 } as PagedAulaResult }
  );

  cambiar(parcial: Partial<AulaFiltro>): void {
    this.filtro.update((f) => ({ ...f, ...parcial, page: 0 }));
  }

  paginar(e: PageEvent): void {
    this.filtro.update((f) => ({ ...f, page: e.pageIndex, size: e.pageSize }));
  }

  abrirCrear(): void {
    this.dialog
      .open(AulaForm, { width: '560px' })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.recarga.update((n) => n + 1);
      });
  }

  // Abre el nuevo modal con autocompletado para asignar o cambiar de tutor
  asignarTutor(aula: AulaResponseDto): void {
    this.dialog
      .open(AsignarTutorAula, { width: '500px', data: aula })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.recarga.update((n) => n + 1);
      });
  }

  // Quita el tutor actual dejando el aula vacante
  async desasignarTutor(aula: AulaResponseDto): Promise<void> {
    const confirmado = await this.alert.confirmarPeligro(
      `¿Remover tutor de ${aula.grado}° "${aula.seccion}"?`,
      'El aula quedará temporalmente sin tutor asignado.',
      'Sí, remover'
    );

    if (!confirmado) return;

    this.api.desasignarTutor(aula.id).subscribe({
      next: () => {
        this.alert.exito('Tutor removido', 'El aula quedó sin tutor asignado.');
        this.recarga.update((n) => n + 1);
      },
      error: (err) => {
        this.alert.error(err?.error?.message ?? 'No se pudo desasignar el tutor.');
      },
    });
  }

  async alternarEstado(aula: AulaResponseDto): Promise<void> {
    const accion = aula.activo ? 'desactivar' : 'reactivar';
    const confirmado = aula.activo
      ? await this.alert.confirmarPeligro(
          `¿Desactivar aula ${aula.grado}° "${aula.seccion}"?`,
          'El aula y sus estudiantes quedarán inactivos.',
          'Sí, desactivar'
        )
      : await this.alert.confirmar(
          `¿Reactivar aula ${aula.grado}° "${aula.seccion}"?`,
          'El aula volverá a estar disponible.'
        );

    if (!confirmado) return;

    const req$ = aula.activo ? this.api.desactivar(aula.id) : this.api.reactivar(aula.id);
    req$.subscribe({
      next: () => {
        this.alert.exito(
          aula.activo ? 'Aula desactivada' : 'Aula reactivada',
          `El aula fue ${accion}da exitosamente.`
        );
        this.recarga.update((n) => n + 1);
      },
      error: (err) => {
        this.alert.error(err?.error?.message ?? `Error al ${accion} el aula.`);
      },
    });
  }
}