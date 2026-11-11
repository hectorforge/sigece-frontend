import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { 
  GRAVEDADES, 
  GRAVEDAD_LABELS, 
  Gravedad, 
  MEDIOS_OCURRENCIA, 
  MEDIO_OCURRENCIA_LABELS, 
  MedioOcurrencia,
  CategoriaSiseve,
  CATEGORIA_SISEVE_LABELS 
} from '../../../core/models/enums';
import { IncidenteApi } from '../../../core/services/incidente-api';
import { TipoIncidenciaApi } from '../../../core/services/tipo-incidencia-api';
import { TipoIncidencia } from '../../../core/models/tipo-incidencia.models';

/** Fecha y hora local en formato estándar para <input type="datetime-local"> */
const ahoraLocal = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const fechaNoFutura = (control: AbstractControl) => {
  if (!control.value) return null;
  const fecha = new Date(control.value).getTime();
  const ahora = Date.now();
  if (Number.isNaN(fecha)) {
    return { fechaInvalida: true };
  }
  return fecha > ahora ? { fechaFutura: true } : null;
};

@Component({
  selector: 'app-incidencia-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './incidencia-form.html',
  styleUrl: './incidencia-form.css',
})
export class IncidenciaForm {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(IncidenteApi);
  private readonly tiposApi = inject(TipoIncidenciaApi);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  // Enums y diccionarios para la plantilla
  readonly gravedades = GRAVEDADES;
  readonly gravedadLabels = GRAVEDAD_LABELS;
  readonly mediosOcurrencia = MEDIOS_OCURRENCIA;
  readonly medioLabels = MEDIO_OCURRENCIA_LABELS;
  readonly categoriaLabels = CATEGORIA_SISEVE_LABELS;

  readonly maxFecha = ahoraLocal();

  guardando = signal<boolean>(false);
  errorTipos = signal<boolean>(false);
  cargandoTipos = signal<boolean>(true);

  tipos = toSignal(
    this.tiposApi.listarActivos().pipe(
      catchError(() => {
        this.errorTipos.set(true);
        return of([] as TipoIncidencia[]);
      }),
      finalize(() => this.cargandoTipos.set(false))
    ),
    { initialValue: [] as TipoIncidencia[] }
  );

  form = this.fb.nonNullable.group({
    tipoIncidenciaId: [null as number | null, Validators.required],
    gravedad: ['', Validators.required],
    fechaOcurrencia: [
      ahoraLocal(),
      [Validators.required, fechaNoFutura],
    ],
    medioOcurrencia: ['PRESENCIAL' as MedioOcurrencia, Validators.required],
    lugarOcurrencia: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(150),
      ],
    ],
    descripcion: [
      '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(2000),
      ],
    ],
    notificarApoderado: [false],
  });

  alElegirTipo(id: number): void {
    const base = this.tipos().find((t) => t.id === id)?.gravedadBase;
    if (base) {
      this.form.patchValue({ gravedad: base });
    }
  }

  obtenerCategoriaLabel(categoria: CategoriaSiseve | string | null | undefined): string {
    if (!categoria) return '';
    return this.categoriaLabels[categoria as CategoriaSiseve] ?? categoria.replaceAll('_', ' ');
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const tipo = this.tipos().find((t) => t.id === v.tipoIncidenciaId);
    this.guardando.set(true);

    this.api
      .registrar(
        {
          tipoIncidenciaId: v.tipoIncidenciaId!,
          gravedad: v.gravedad as Gravedad,
          descripcion: v.descripcion.trim(),
          lugarOcurrencia: v.lugarOcurrencia.trim(),
          medioOcurrencia: v.medioOcurrencia as MedioOcurrencia,
          fechaOcurrencia: new Date(v.fechaOcurrencia).toISOString(),
          notificarApoderado: v.notificarApoderado,
        },
        tipo?.nombre
      )
      .subscribe({
        next: (inc) => {
          this.snack.open(
            `Incidencia ${inc.codigoCaso} registrada exitosamente`,
            'Cerrar',
            { duration: 4000 }
          );
          this.router.navigate(['/incidencias', inc.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.guardando.set(false);

          let mensaje = 'No se pudo registrar la incidencia. Inténtalo nuevamente.';

          if (error.status === 0) {
            mensaje = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          } else if (error.error?.message) {
            mensaje = error.error.message;
          } else if (error.status === 400) {
            mensaje = 'Los datos enviados no son válidos. Revisa el formulario.';
          } else if (error.status === 401 || error.status === 403) {
            mensaje = 'No tienes autorización para registrar esta incidencia.';
          }

          this.snack.open(mensaje, 'Cerrar', { duration: 5000 });
        },
      });
  }
}