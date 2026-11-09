import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Estudiante, EstudianteRequest } from '../../../core/models/estudiante.models';
import { AulaResponseDto } from '../../../core/models/aula.models';
import { EstudianteApi } from '../../../core/services/estudiante-api';
import { AulaApi } from '../../../core/services/aula-api';
import { AlertService } from '../../../core/services/alert.service';

export const fechaPasadaValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  if (!control.value) return null;
  const fechaIngresada = new Date(control.value + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fechaIngresada >= hoy) {
    return { fechaFutura: true };
  }
  return null;
};

@Component({
  selector: 'app-estudiante-form',
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
  templateUrl: './estudiante-form.html',
  styleUrl: './estudiante-form.css',
})
export class EstudianteForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EstudianteApi);
  private readonly aulaApi = inject(AulaApi);
  private readonly alert = inject(AlertService);
  private readonly ref = inject(MatDialogRef<EstudianteForm>);

  readonly datos = inject<Estudiante | null>(MAT_DIALOG_DATA);
  readonly backendError = signal<string | null>(null);
  readonly guardando = signal(false);
  readonly aulas = signal<AulaResponseDto[]>([]);

  readonly maxFecha = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  })();

  form = this.fb.nonNullable.group({
    codigoSiagie: [
      this.datos?.codigoSiagie ?? '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9\-_]+$/),
      ],
    ],
    nombres: [
      this.datos?.nombres ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    apellidos: [
      this.datos?.apellidos ?? '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    fechaNacimiento: [
      this.datos?.fechaNacimiento ?? '',
      [Validators.required, fechaPasadaValidator],
    ],
    aulaId: [
      this.datos?.aulaId ?? (null as unknown as number),
      [Validators.required],
    ],
  });

  ngOnInit(): void {
    // Carga de salones activos disponibles
    this.aulaApi.listarOpcionesActivas().subscribe({
      next: (res) => this.aulas.set(res ?? []),
      error: () => this.alert.error('No se pudo cargar el catálogo de aulas.'),
    });
  }

  guardar(): void {
    this.backendError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alert.aviso(
        'Por favor completa correctamente todos los campos obligatorios.',
        'Formulario incompleto'
      );
      return;
    }

    this.guardando.set(true);
    const raw = this.form.getRawValue();

    const dto: EstudianteRequest = {
      codigoSiagie: raw.codigoSiagie.trim(),
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      fechaNacimiento: raw.fechaNacimiento,
      aulaId: raw.aulaId,
    };

    const req$ = this.datos
      ? this.api.actualizar(this.datos.id, dto)
      : this.api.registrar(dto);

    req$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.alert.exito(
          this.datos ? '¡Estudiante actualizado!' : '¡Estudiante registrado!',
          'Los datos se guardaron correctamente en el padrón.'
        );
        this.ref.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.manejarError(err);
      },
    });
  }

  async cancelar(): Promise<void> {
    if (this.form.dirty) {
      const confirmarSalida = await this.alert.confirmarPeligro(
        '¿Deseas cancelar?',
        'Tienes cambios sin guardar que se perderán definitivamente.',
        'Sí, salir'
      );
      if (confirmarSalida) this.ref.close(false);
    } else {
      this.ref.close(false);
    }
  }

  private manejarError(err: HttpErrorResponse): void {
    const body = err.error;
    const mensajeGeneral =
      body?.message ??
      body?.mensaje ??
      'Ocurrió un error al intentar procesar los datos del estudiante.';

    this.backendError.set(mensajeGeneral);
    this.alert.error(mensajeGeneral, 'Error al guardar');
  }

  errorBackend(campo: string): string | null {
    return this.form.get(campo)?.getError('backend') ?? null;
  }
}