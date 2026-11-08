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

import { Auth } from '../../../core/auth/auth';
import { AlertService } from '../../../core/services/alert.service';
import { TutorAulaApi } from '../../../core/services/tutor-aula-api';
import { Nivel, TutorAulaFiltroAula, TutorAulaResponse } from '../../../core/models/tutor-aula.models';
import { TutorAulaForm } from '../tutor-aula-form/tutor-aula-form';

@Component({
  selector: 'app-tutor-aula-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './tutor-aula-list.html',
  styleUrl: './tutor-aula-list.css',
})
export class TutorAulaList {
  private readonly api = inject(TutorAulaApi);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(Auth);
  private readonly alert = inject(AlertService);

  readonly anioActual = new Date().getFullYear();
  readonly niveles: Nivel[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  readonly columnas = ['tutor', 'documento', 'aula', 'anio', 'estado', 'acciones'];

  // Control de permisos según roles institucionales
  readonly puedeEditar = this.auth.tieneRol(['ROLE_ADMINISTRADOR', 'ROLE_DIRECTOR']);

  filtro = signal<TutorAulaFiltroAula>({
    nivel: 'SECUNDARIA',
    grado: '1',
    seccion: 'A',
    anioEscolar: this.anioActual,
  });

  private recarga = signal(0);

  resultado = toSignal(
    combineLatest([toObservable(this.filtro), toObservable(this.recarga)]).pipe(
      switchMap(([f]) => {
        if (!f.nivel || !f.grado || !f.seccion) {
          return of([] as TutorAulaResponse[]);
        }
        return this.api.listarTutoresPorAula(f.nivel, f.grado, f.seccion, f.anioEscolar).pipe(
          catchError(() => {
            this.alert.error('No se pudo cargar la lista de tutores del aula.');
            return of([] as TutorAulaResponse[]);
          })
        );
      })
    ),
    { initialValue: [] as TutorAulaResponse[] }
  );

  cambiar(parcial: Partial<TutorAulaFiltroAula>): void {
    this.filtro.update((f) => ({ ...f, ...parcial }));
  }

  abrirForm(): void {
    const f = this.filtro();
    this.dialog
      .open(TutorAulaForm, {
        width: '560px',
        data: {
          nivel: f.nivel,
          grado: f.grado,
          seccion: f.seccion,
          anioEscolar: f.anioEscolar,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.recarga.update((n) => n + 1);
        }
      });
  }

  async desactivar(item: TutorAulaResponse): Promise<void> {
    const tutorNombre = item.tutorNombre || `Docente (ID: ${item.usuarioId})`;

    // Confirmación modal con SweetAlert2 mediante AlertService
    const confirmado = await this.alert.confirmarPeligro(
      `¿Deseas desactivar la tutoría de ${tutorNombre}?`,
      `El docente dejará de figurar como tutor activo de ${item.grado}° "${item.seccion}" (${item.nivel}).`,
      'Sí, desactivar'
    );

    if (!confirmado) return;

    this.api.desactivar(item.id).subscribe({
      next: () => {
        this.alert.exito(
          'Asignación desactivada',
          `${tutorNombre} ha sido desactivado como tutor del aula.`
        );
        this.recarga.update((n) => n + 1);
      },
      error: (err) => {
        const errorMsg =
          err?.error?.message ??
          err?.error?.mensaje ??
          err?.message ??
          'No se pudo desactivar la asignación.';

        this.alert.error(errorMsg, 'Error al desactivar');
      },
    });
  }

  async reactivar(item: TutorAulaResponse): Promise<void> {
    const tutorNombre = item.tutorNombre || `Docente (ID: ${item.usuarioId})`;

    const confirmado = await this.alert.confirmar(
      `¿Deseas reactivar la tutoría de ${tutorNombre}?`,
      'El docente volverá a estar asignado activamente a esta aula.'
    );

    if (!confirmado) return;

    this.api.reactivar(item.id).subscribe({
      next: () => {
        this.alert.exito(
          'Asignación reactivada',
          `${tutorNombre} vuelve a ser tutor activo del aula.`
        );
        this.recarga.update((n) => n + 1);
      },
      error: (err) => {
        const errorMsg =
          err?.error?.message ??
          err?.error?.mensaje ??
          err?.message ??
          'No se pudo reactivar la asignación.';

        this.alert.error(errorMsg, 'Error al reactivar');
      },
    });
  }
}