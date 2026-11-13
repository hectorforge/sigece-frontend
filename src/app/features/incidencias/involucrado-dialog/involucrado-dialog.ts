import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, filter, switchMap } from 'rxjs';
import { InvolucradoRequest } from '../../../core/models/incidente.models';
import { EstudianteApi } from '../../../core/services/estudiante-api';
import { EstudianteResumen } from '../../../core/models/estudiante.models';

@Component({
  selector: 'app-involucrado-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatAutocompleteModule, MatButtonModule,
  ],
  templateUrl: './involucrado-dialog.html',
  styleUrl: './involucrado-dialog.css',
})
export class InvolucradoDialog {
  private ref = inject(MatDialogRef<InvolucradoDialog>);
  private estudiantesApi = inject(EstudianteApi);

  seleccionado: EstudianteResumen | null = null;

  form = new FormGroup({
    estudiante: new FormControl<string | EstudianteResumen>('', Validators.required),
    rolInvolucrado: new FormControl<'VICTIMA' | 'AGRESOR' | 'TESTIGO'>('VICTIMA', { nonNullable: true }),
    observaciones: new FormControl(''),
  });

  resultados = toSignal(
    this.form.controls.estudiante.valueChanges.pipe(
      debounceTime(300),
      filter((v): v is string => typeof v === 'string' && v.trim().length >= 2),
      switchMap((v) => this.estudiantesApi.autocompletar(v.trim())),
    ),
    { initialValue: [] as EstudianteResumen[] },
  );

  constructor() {
    // Si el usuario vuelve a escribir, se descarta el estudiante elegido antes
    this.form.controls.estudiante.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => {
        if (typeof v === 'string') this.seleccionado = null;
      });
  }

  mostrar = (e: string | EstudianteResumen | null) => 
    e && typeof e !== 'string' ? `${e.apellidos}, ${e.nombres} (${e.codigoSiagie})` : '';

  guardar() {
    if (!this.seleccionado) return;
    const v = this.form.getRawValue();
    const dto: InvolucradoRequest = {
      estudianteId: this.seleccionado.id,
      rolInvolucrado: v.rolInvolucrado,
      observaciones: v.observaciones || undefined,
    };
    this.ref.close({ dto, nombre: this.mostrar(this.seleccionado) });
  }
}