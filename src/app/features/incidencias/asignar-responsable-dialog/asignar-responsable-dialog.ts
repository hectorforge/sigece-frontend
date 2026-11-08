import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, map, of, startWith, switchMap, catchError } from 'rxjs';

import { UsuarioApi } from '../../../core/services/usuario-api';
import { UsuarioMantenimientoResponseDto } from '../../../core/models/usuario.models';

const seleccionValida = (c: AbstractControl) =>
  typeof c.value === 'object' && c.value ? null : { seleccion: true };

@Component({
  selector: 'app-asignar-responsable-dialog',
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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.esReasignacion ? 'swap_horiz' : 'person_add' }}</mat-icon>
      {{ data.esReasignacion ? 'Reasignar Responsable del Caso' : 'Asignar Responsable del Caso' }}
    </h2>

    <mat-dialog-content>
      <p class="dialog-desc">
        {{ data.esReasignacion
          ? 'Busca al nuevo Psicólogo o Tutor por su nombre o documento.'
          : 'Selecciona al docente tutor o psicólogo que liderará el caso. Al asignar, el caso pasará a EN INVESTIGACIÓN.' }}
      </p>

      <form [formGroup]="form" class="formulario">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Buscar Docente / Psicólogo</mat-label>
          <input
            matInput
            formControlName="usuario"
            [matAutocomplete]="auto"
            placeholder="Escribe nombres, apellidos o DNI..."
          />
          <mat-icon matSuffix>search</mat-icon>
          <mat-autocomplete #auto="matAutocomplete" [displayWith]="mostrar">
            @for (u of opciones(); track u.id) {
              <mat-option [value]="u">
                <div class="opcion-usuario">
                  <strong>{{ u.apellidos }}, {{ u.nombres }}</strong>
                  <small>{{ u.dni }} · {{ u.rol?.nombre ?? 'USUARIO' }}</small>
                </div>
              </mat-option>
            }
          </mat-autocomplete>
          @if (form.controls.usuario.hasError('seleccion') && form.controls.usuario.touched) {
            <mat-error>Debes seleccionar un usuario de la lista desplegable</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Motivo de la asignación (opcional)</mat-label>
          <textarea
            matInput
            formControlName="motivo"
            rows="3"
            placeholder="Justificación o indicación para el expediente..."
          ></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()" [disabled]="form.invalid">
        {{ data.esReasignacion ? 'Reasignar' : 'Asignar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-desc {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 16px;
    }
    .formulario {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 420px;
    }
    .w-full {
      width: 100%;
    }
    .opcion-usuario {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      padding: 4px 0;
    }
    .opcion-usuario small {
      color: #6b7280;
      font-size: 0.75rem;
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `],
})
export class AsignarResponsableDialog {
  private fb = inject(FormBuilder);
  private usuarioApi = inject(UsuarioApi);
  private ref = inject(MatDialogRef<AsignarResponsableDialog>);
  data = inject<{ esReasignacion: boolean }>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    usuario: [null as UsuarioMantenimientoResponseDto | string | null, [Validators.required, seleccionValida]],
    motivo: [''],
  });

  opciones = toSignal(
    this.form.controls.usuario.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map((v) => (typeof v === 'string' ? v.trim() : '')),
      switchMap((termino) => {
        if (!termino) return of([] as UsuarioMantenimientoResponseDto[]);
        return this.usuarioApi.buscar({ termino, activo: true, page: 0, size: 5 }).pipe(
          map((r) => r.data ?? []),
          catchError(() => of([] as UsuarioMantenimientoResponseDto[]))
        );
      })
    ),
    { initialValue: [] as UsuarioMantenimientoResponseDto[] }
  );

  mostrar = (u: UsuarioMantenimientoResponseDto | string | null): string => {
    if (u && typeof u === 'object') {
      return `${u.apellidos}, ${u.nombres} (${u.dni})`;
    }
    return '';
  };

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.getRawValue();
    const usuarioSeleccionado = val.usuario as UsuarioMantenimientoResponseDto;
    this.ref.close({
      responsableId: usuarioSeleccionado.id,
      motivo: val.motivo?.trim() || undefined,
    });
  }
}