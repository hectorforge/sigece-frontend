import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { GRAVEDADES } from '../../../core/models/enums';
import { AlertService } from '../../../core/services/alert.service';
import { SiseveApiService } from '../../../core/services/siseve-api';
import {
  ModoDerivacion,
  SiseveDerivacionRequest,
  SiseveDerivacionResponse,
  SiseveEvaluacion,
  SisevePendiente,
} from '../../../core/models/siseve-api.models';

@Component({
  selector: 'app-derivacion-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './derivacion-list.html',
  styleUrl: './derivacion-list.css',
})
export class DerivacionList implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly alert = inject(AlertService);
  private readonly siseveApi = inject(SiseveApiService);

  readonly gravedades = GRAVEDADES;

  // Columnas de tablas
  readonly columnasPendientes = ['codigo', 'fecha', 'tipo', 'gravedad', 'plazo', 'alertas', 'acciones'];
  readonly columnasDerivadas = ['codigo', 'codigoSiseve', 'fechaReporte', 'derivadoPor', 'observaciones'];

  // Estados reactivos
  bandeja = signal<'PENDIENTES' | 'DERIVADOS'>('PENDIENTES');
  cargando = signal(false);
  guardando = signal(false);
  evaluandoId = signal<string | null>(null);

  filtro = signal({
    texto: '',
    gravedad: '',
    urgente: '',
    pagina: 0,
    tamano: 10,
  });

  // Datos del backend
  listaPendientes = signal<SisevePendiente[]>([]);
  listaDerivadas = signal<SiseveDerivacionResponse[]>([]);

  // Estados de modales
  casoAEvaluar = signal<SiseveEvaluacion | null>(null);
  casoADerivar = signal<SisevePendiente | null>(null);

  // Formulario reactivo
  formDerivacion: FormGroup = this.fb.group({
    codigoSiseve: ['', [Validators.required, Validators.pattern(/^\S+.*$/)]],
    modoDerivacion: ['MANUAL_PORTAL' as ModoDerivacion, [Validators.required]],
    observacionesSiseve: [''],
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ================= LLAMADAS AL SERVICIO =================

  cargarDatos(): void {
    this.cargando.set(true);

    if (this.bandeja() === 'PENDIENTES') {
      this.siseveApi.listarPendientes().subscribe({
        next: (data) => {
          this.listaPendientes.set(data ?? []);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.alert.error('Error al cargar', err?.error?.message || 'No se pudieron obtener los casos pendientes.');
        },
      });
    } else {
      this.siseveApi.listarDerivados().subscribe({
        next: (data) => {
          this.listaDerivadas.set(data ?? []);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.alert.error('Error al cargar', err?.error?.message || 'No se pudieron obtener los casos derivados.');
        },
      });
    }
  }

  // ================= FILTRADO Y PAGINACIÓN =================

  // 1. Filtrado de pendientes
  pendientesFiltrados = computed<SisevePendiente[]>(() => {
    const texto = this.filtro().texto.toLowerCase().trim();
    const grav = this.filtro().gravedad;
    const urg = this.filtro().urgente;

    return this.listaPendientes().filter((item) => {
      const matchTexto =
        !texto ||
        item.codigoCaso?.toLowerCase().includes(texto) ||
        item.tipoIncidenciaNombre?.toLowerCase().includes(texto);

      const matchGravedad = !grav || item.gravedad === grav;

      const matchUrgente =
        !urg ||
        (urg === 'urgente' && item.diasTranscurridos >= 1) ||
        (urg === 'en_plazo' && item.diasTranscurridos === 0);

      return matchTexto && matchGravedad && matchUrgente;
    });
  });

  // 2. Filtrado de derivadas
  derivadasFiltradas = computed<SiseveDerivacionResponse[]>(() => {
    const texto = this.filtro().texto.toLowerCase().trim();

    return this.listaDerivadas().filter((item) => {
      return (
        !texto ||
        item.codigoCaso?.toLowerCase().includes(texto) ||
        item.codigoSiseve?.toLowerCase().includes(texto) ||
        (item.derivadoPor ?? '').toLowerCase().includes(texto) ||
        (item.observacionesSiseve ?? '').toLowerCase().includes(texto)
      );
    });
  });

  // Total de elementos según los filtros activos para sincronizar el paginador
  totalElementos = computed(() => {
    return this.bandeja() === 'PENDIENTES'
      ? this.pendientesFiltrados().length
      : this.derivadasFiltradas().length;
  });

  // Elementos paginados para las tablas
  pendientesPaginados = computed<SisevePendiente[]>(() => {
    const inicio = this.filtro().pagina * this.filtro().tamano;
    return this.pendientesFiltrados().slice(inicio, inicio + this.filtro().tamano);
  });

  derivadasPaginadas = computed<SiseveDerivacionResponse[]>(() => {
    const inicio = this.filtro().pagina * this.filtro().tamano;
    return this.derivadasFiltradas().slice(inicio, inicio + this.filtro().tamano);
  });

  // ================= EVENTOS DE INTERFAZ =================

  cambiarBandeja(nuevaBandeja: 'PENDIENTES' | 'DERIVADOS'): void {
    this.bandeja.set(nuevaBandeja);
    this.filtro.update((f) => ({ ...f, pagina: 0 }));
    this.cargarDatos();
  }

  cambiar(parcial: Partial<{ texto: string; gravedad: string; urgente: string }>): void {
    this.filtro.update((f) => ({ ...f, ...parcial, pagina: 0 }));
  }

  paginar(e: PageEvent): void {
    this.filtro.update((f) => ({ ...f, pagina: e.pageIndex, tamano: e.pageSize }));
  }

  // ================= EVALUACIÓN =================

  abrirEvaluacion(caso: SisevePendiente): void {
    this.evaluandoId.set(caso.incidenteId);

    this.siseveApi.evaluarCaso(caso.incidenteId).subscribe({
      next: (evaluacion) => {
        this.evaluandoId.set(null);
        this.casoAEvaluar.set(evaluacion);
      },
      error: (err) => {
        this.evaluandoId.set(null);
        this.alert.error(
          'Error de consulta',
          err?.error?.message || 'No se pudo obtener la evaluación técnica del caso.'
        );
      },
    });
  }

  cerrarEvaluacion(): void {
    this.casoAEvaluar.set(null);
  }

  // ================= DERIVACIÓN =================

  abrirDerivar(caso: SisevePendiente): void {
    this.casoADerivar.set(caso);
    this.formDerivacion.reset({
      codigoSiseve: '',
      modoDerivacion: 'MANUAL_PORTAL',
      observacionesSiseve: '',
    });
  }

  cerrarDerivar(): void {
    this.casoADerivar.set(null);
  }

  async confirmarDerivacion(): Promise<void> {
    if (this.formDerivacion.invalid || this.guardando()) {
      this.formDerivacion.markAllAsTouched();
      return;
    }

    const caso = this.casoADerivar();
    if (!caso) return;

    const val = this.formDerivacion.getRawValue();

    const confirmar = await this.alert.confirmar(
      '¿Registrar derivación a SíSeVe?',
      `El caso ${caso.codigoCaso} quedará registrado con el código SíSeVe: ${val.codigoSiseve}`,
      'Sí, registrar derivación'
    );

    if (!confirmar) return;

    this.guardando.set(true);

    const payload: SiseveDerivacionRequest = {
      codigoSiseve: val.codigoSiseve.trim(),
      modoDerivacion: val.modoDerivacion,
      observacionesSiseve: val.observacionesSiseve?.trim() || undefined,
    };

    this.siseveApi.derivarCaso(caso.incidenteId, payload).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.cerrarDerivar();
        this.alert.exito('Caso derivado exitosamente', `Código SíSeVe asignado: ${res.codigoSiseve}`);
        this.cargarDatos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.alert.error(
          'Error al registrar derivación',
          err?.error?.message || 'Ocurrió un error al procesar la derivación.'
        );
      },
    });
  }
}