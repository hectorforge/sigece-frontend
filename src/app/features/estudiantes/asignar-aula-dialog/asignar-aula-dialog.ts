import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { Estudiante, EstudianteRequest } from '../../../core/models/estudiante.models';
import { AulaResponseDto } from '../../../core/models/aula.models';
import { EstudianteApi } from '../../../core/services/estudiante-api';
import { AulaApi } from '../../../core/services/aula-api';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-asignar-aula-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './asignar-aula-dialog.html',
  styles: [`
    .info-actual {
      margin-bottom: 16px;
      padding: 10px 14px;
      background: #f1f5f9;
      border-radius: 8px;
      font-size: 13px;
    }
    .full { width: 100%; margin-top: 8px; }
  `],
})
export class AsignarAulaDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly estudianteApi = inject(EstudianteApi);
  private readonly aulaApi = inject(AulaApi);
  private readonly alert = inject(AlertService);
  private readonly ref = inject(MatDialogRef<AsignarAulaDialog>);

  readonly estudiante = inject<Estudiante>(MAT_DIALOG_DATA);
  readonly aulas = signal<AulaResponseDto[]>([]);
  readonly guardando = signal(false);

  form = this.fb.nonNullable.group({
    aulaId: [this.estudiante.aulaId, [Validators.required]],
  });

  ngOnInit(): void {
    // Carga de opciones de aulas activas
    this.aulaApi.listarOpcionesActivas().subscribe({
      next: (res) => this.aulas.set(res ?? []),
      error: () => this.alert.error('No se pudo cargar la lista de aulas activas.'),
    });
  }

  guardar(): void {
    if (this.form.invalid) return;

    this.guardando.set(true);
    const nuevoAulaId = this.form.getRawValue().aulaId;

    const dto: EstudianteRequest = {
      codigoSiagie: this.estudiante.codigoSiagie,
      nombres: this.estudiante.nombres,
      apellidos: this.estudiante.apellidos,
      fechaNacimiento: this.estudiante.fechaNacimiento,
      aulaId: nuevoAulaId,
    };

    this.estudianteApi.actualizar(this.estudiante.id, dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.alert.exito('Aula reasignada', `Se actualizó el aula del estudiante.`);
        this.ref.close(true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.alert.error(err?.error?.message ?? 'No se pudo reasignar el aula.');
      },
    });
  }

  cancelar(): void {
    this.ref.close(false);
  }
}