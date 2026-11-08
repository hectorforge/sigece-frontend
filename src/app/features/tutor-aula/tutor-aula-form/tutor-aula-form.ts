import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

import { Nivel, TutorAulaRequest } from '../../../core/models/tutor-aula.models';
import { TutorAulaApi } from '../../../core/services/tutor-aula-api';

export interface TutorAulaDataDialog {
  nivel?: Nivel;
  grado?: string;
  seccion?: string;
  anioEscolar?: number;
}

@Component({
  selector: 'app-tutor-aula-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './tutor-aula-form.html',
  styleUrl: './tutor-aula-form.css',
})
export class TutorAulaForm {
  private fb = inject(FormBuilder);
  private api = inject(TutorAulaApi);
  private ref = inject(MatDialogRef<TutorAulaForm>);
  datos = inject<TutorAulaDataDialog | null>(MAT_DIALOG_DATA);

  readonly niveles: Nivel[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  guardando = signal(false);
  backendError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    usuarioId: [
      null as number | null,
      [Validators.required, Validators.min(1)],
    ],
    nivel: [(this.datos?.nivel ?? 'SECUNDARIA') as Nivel, Validators.required],
    grado: [
      this.datos?.grado ?? '',
      [Validators.required, Validators.maxLength(20)],
    ],
    seccion: [
      this.datos?.seccion ?? '',
      [Validators.required, Validators.maxLength(10)],
    ],
    anioEscolar: [
      this.datos?.anioEscolar ?? new Date().getFullYear(),
      [Validators.required, Validators.min(2000), Validators.max(2100)],
    ],
  });

  guardar() {
    this.backendError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const v = this.form.getRawValue();

    const dto: TutorAulaRequest = {
      usuarioId: v.usuarioId!,
      nivel: v.nivel,
      grado: v.grado.trim(),
      seccion: v.seccion.trim().toUpperCase(),
      anioEscolar: v.anioEscolar,
    };

    this.api.asignarAula(dto).subscribe({
      next: () => {
        this.guardando.set(false);

        // Alerta de éxito con SweetAlert2
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Aula asignada exitosamente al tutor',
          timer: 2000,
          showConfirmButton: false,
        });

        this.ref.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.manejarError(err);
      },
    });
  }

  // Método de cancelación con confirmación de SweetAlert2
  cancelar() {
    if (this.form.dirty) {
      Swal.fire({
        title: '¿Deseas salir?',
        text: 'Tienes cambios sin guardar que se perderán.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
      }).then((result) => {
        if (result.isConfirmed) {
          this.ref.close();
        }
      });
    } else {
      this.ref.close();
    }
  }

  private manejarError(err: HttpErrorResponse) {
    const body = err.error;

    // 1) Errores por campo
    const errores = body?.errors as Record<string, string> | undefined;
    if (errores && typeof errores === 'object') {
      for (const [campo, mensaje] of Object.entries(errores)) {
        const control = this.form.get(campo);
        if (control) {
          control.setErrors({ backend: mensaje });
          control.markAsTouched();
        }
      }
    }

    // 2) Mensaje general
    const mensajeGeneral = body?.message ?? 'Ocurrió un error al asignar el tutor al aula';
    this.backendError.set(mensajeGeneral);

    // Alerta de error general con SweetAlert2
    Swal.fire({
      icon: 'error',
      title: 'Atención',
      text: mensajeGeneral,
      confirmButtonText: 'Entendido',
    });
  }

  // Helper para el template
  errorBackend(campo: string): string | null {
    return this.form.get(campo)?.getError('backend') ?? null;
  }
}