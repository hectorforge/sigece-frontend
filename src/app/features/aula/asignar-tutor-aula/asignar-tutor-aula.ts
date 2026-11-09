import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, filter, map, of, switchMap } from 'rxjs';

import { AulaResponseDto } from '../../../core/models/aula.models';
import { AulaApi } from '../../../core/services/aula-api';
import { UsuarioApi } from '../../../core/services/usuario-api';
import { AlertService } from '../../../core/services/alert.service';

export interface UsuarioResumen {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  username?: string;
}

@Component({
  selector: 'app-asignar-tutor-aula',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './asignar-tutor-aula.html',
  styleUrl: './asignar-tutor-aula.css',
})
export class AsignarTutorAula {
  private readonly ref = inject(MatDialogRef<AsignarTutorAula>);
  private readonly aulaApi = inject(AulaApi);
  private readonly usuarioApi = inject(UsuarioApi);
  private readonly alert = inject(AlertService);

  readonly aula = inject<AulaResponseDto>(MAT_DIALOG_DATA);

  guardando = signal(false);
  tutorSeleccionado = signal<UsuarioResumen | null>(null);

  form = new FormGroup({
    tutor: new FormControl<string | UsuarioResumen | null>('', [Validators.required]),
  });

  // Búsqueda reactiva con autocompletado de docentes con rol TUTOR
  tutoresResultados = toSignal(
    this.form.controls.tutor.valueChanges.pipe(
      debounceTime(300),
      filter((v): v is string => typeof v === 'string' && v.trim().length >= 2),
      switchMap((v) =>
        this.usuarioApi
          .buscar({
            termino: v.trim(),
            //rol: 'ROLE_TUTOR',
            activo: true,
            page: 0,
            size: 8,
          })
          .pipe(
            map((p: any) => (Array.isArray(p) ? p : p.content ?? p.data ?? [])),
            catchError(() => of([] as UsuarioResumen[]))
          )
      )
    ),
    { initialValue: [] as UsuarioResumen[] }
  );

  constructor() {
    this.form.controls.tutor.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => {
        if (typeof v === 'string') {
          this.tutorSeleccionado.set(null);
        }
      });
  }

  mostrarTutor = (u: string | UsuarioResumen | null): string => {
    if (!u || typeof u === 'string') return '';
    return `${u.apellidos}, ${u.nombres} (DNI: ${u.dni})`;
  };

  limpiarTutor(e: MouseEvent): void {
    e.stopPropagation();
    this.form.controls.tutor.setValue('');
    this.tutorSeleccionado.set(null);
  }

  guardar(): void {
    const valor = this.form.controls.tutor.value;

    if (typeof valor === 'string' && valor.trim().length > 0 && !this.tutorSeleccionado()) {
      this.form.controls.tutor.setErrors({ noSeleccionado: true });
      return;
    }

    if (!this.tutorSeleccionado()) {
      this.form.controls.tutor.setErrors({ required: true });
      return;
    }

    this.guardando.set(true);
    const tutorId = this.tutorSeleccionado()!.id;

    this.aulaApi.asignarTutor(this.aula.id, { tutorId }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.alert.exito(
          'Tutor asignado',
          `Se asignó correctamente al docente como tutor del aula ${this.aula.grado}° "${this.aula.seccion}".`
        );
        this.ref.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.alert.error(err?.error?.message ?? 'No se pudo asignar el tutor.');
      },
    });
  }

  cancelar(): void {
    this.ref.close(false);
  }
}