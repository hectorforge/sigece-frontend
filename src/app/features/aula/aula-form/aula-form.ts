import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, filter, map, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';

import { AulaApi } from '../../../core/services/aula-api';
import { UsuarioApi } from '../../../core/services/usuario-api';
import { Nivel } from '../../../core/models/enums';
import { AulaRequest } from '../../../core/models/aula.models';

export interface AulaDataDialog {
  nivel?: Nivel;
  grado?: string;
  seccion?: string;
  anioEscolar?: number;
}

export interface UsuarioResumen {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  username?: string;
}

@Component({
  selector: 'app-aula-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './aula-form.html',
  styleUrl: './aula-form.css',
})
export class AulaForm {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AulaApi);
  private readonly usuarioApi = inject(UsuarioApi);
  private readonly ref = inject(MatDialogRef<AulaForm>);
  readonly datos = inject<AulaDataDialog | null>(MAT_DIALOG_DATA);

  readonly niveles: Nivel[] = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  readonly anioActual = new Date().getFullYear();

  guardando = signal(false);
  backendError = signal<string | null>(null);

  // Almacena el tutor que ha sido seleccionado del autocompletado
  tutorSeleccionado = signal<UsuarioResumen | null>(null);

  form = this.fb.group({
    nivel: [(this.datos?.nivel ?? 'SECUNDARIA') as Nivel, [Validators.required]],
    grado: [
      this.datos?.grado ?? '',
      [Validators.required, Validators.maxLength(20)],
    ],
    seccion: [
      this.datos?.seccion ?? '',
      [Validators.required, Validators.maxLength(10)],
    ],
    anioEscolar: [
      this.datos?.anioEscolar ?? this.anioActual,
      [Validators.required, Validators.min(2000), Validators.max(2100)],
    ],
    // Control que maneja el texto del input o el objeto seleccionado
    tutor: new FormControl<string | UsuarioResumen | null>(''),
  });

  // Búsqueda reactiva idéntica a InvolucradoDialog
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
    // Si el usuario vuelve a escribir en el input, se descarta el tutor seleccionado previamente
    this.form.controls.tutor.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => {
        if (typeof v === 'string') {
          this.tutorSeleccionado.set(null);
        }
      });
  }

  // Función para formatear lo que se muestra en el input al seleccionar una opción
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
    this.backendError.set(null);

    // Validación: si escribió texto pero no seleccionó a nadie del autocompletado
    const valorTutorInput = this.form.controls.tutor.value;
    if (typeof valorTutorInput === 'string' && valorTutorInput.trim().length > 0 && !this.tutorSeleccionado()) {
      this.form.controls.tutor.setErrors({ noSeleccionado: true });
      this.form.controls.tutor.markAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const v = this.form.getRawValue();
    const tutor = this.tutorSeleccionado();

    const dto: AulaRequest = {
      nivel: v.nivel!,
      grado: v.grado!.trim(),
      seccion: v.seccion!.trim().toUpperCase(),
      anioEscolar: v.anioEscolar!,
      tutorId: tutor ? tutor.id : null,
    };

    this.api.registrarAula(dto).subscribe({
      next: () => {
        this.guardando.set(false);
        Swal.fire({
          icon: 'success',
          title: '¡Aula Registrada!',
          text: `El aula ${dto.grado}° "${dto.seccion}" (${dto.nivel}) fue creada exitosamente.`,
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

  cancelar(): void {
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
          this.ref.close(false);
        }
      });
    } else {
      this.ref.close(false);
    }
  }

  private manejarError(err: HttpErrorResponse): void {
    const body = err.error;
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

    const mensajeGeneral =
      body?.message ?? body?.mensaje ?? 'Ocurrió un error al registrar el aula.';
    this.backendError.set(mensajeGeneral);

    Swal.fire({
      icon: 'error',
      title: 'Error al registrar',
      text: mensajeGeneral,
      confirmButtonText: 'Entendido',
    });
  }

  errorBackend(campo: string): string | null {
    return this.form.get(campo)?.getError('backend') ?? null;
  }
}