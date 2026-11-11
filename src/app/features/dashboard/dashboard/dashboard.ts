import { NgTemplateOutlet, CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox'; // <-- Importado

import { Auth } from '../../../core/auth/auth';
import { DashboardFiltro, Indicadores } from '../../../core/models/dashboard.models';
import { FormatoReporte } from '../../../core/models/reporte.models';
import { NIVELES } from '../../../core/models/enums';
import { DashboardApi } from '../../../core/services/dashboard-api';
import { ReporteApi } from '../../../core/services/reporte-api';
import { AlertService } from '../../../core/services/alert.service';

const COLOR_GRAVEDAD: Record<string, string> = { 
  LEVE: '#2e7d32', 
  MODERADO: '#f9a825', 
  GRAVE: '#ef6c00', 
  MUY_GRAVE: '#c62828' 
};

const COLOR_ESTADO: Record<string, string> = {
  REGISTRADO: '#546e7a', 
  EN_INVESTIGACION: '#1565c0', 
  EN_SEGUIMIENTO: '#6a1b9a',
  RESUELTO: '#2e7d32', 
  CERRADO: '#37474f',
};

const MESES: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Oct', '11': 'Nov', '12': 'Dic'
};

interface Fila { 
  etiqueta: string; 
  valor: number; 
  ancho: number; 
  color: string; 
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatCheckboxModule, // <-- Agregado a los imports
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly api = inject(DashboardApi);
  private readonly reporteApi = inject(ReporteApi);
  private readonly alert = inject(AlertService);
  private readonly auth = inject(Auth);

  readonly esAdmin = this.auth.tieneRol(['ROLE_ADMINISTRADOR']);
  readonly esPsicologo = this.auth.tieneRol(['ROLE_PSICOLOGO']);
  readonly puedeExportar = this.esAdmin || this.esPsicologo;

  readonly exportando = signal(false);
  readonly niveles = NIVELES;
  readonly hoy = new Date().toISOString().slice(0, 10);
  readonly anioActual = new Date().getFullYear();

  // Control para filtro por año completo
  readonly filtrarPorAnio = signal(false);
  readonly anioFiltro = signal(this.anioActual);

  filtro = signal<DashboardFiltro>({ 
    fechaDesde: `${new Date().getFullYear()}-01-01`, 
    fechaHasta: this.hoy, 
    nivel: '', 
    grado: '' 
  });
  
  error = signal(false);

  datos = toSignal(
    toObservable(this.filtro).pipe(
      switchMap(f => { 
        this.error.set(false); 
        return this.api.obtener(f).pipe(
          catchError(() => { 
            this.error.set(true); 
            return of(null as Indicadores | null); 
          })
        ); 
      }),
    ),
    { initialValue: null as Indicadores | null },
  );

  gravedad = computed(() => this.filas(this.datos()?.incidentesPorGravedad, COLOR_GRAVEDAD));
  estado = computed(() => this.filas(this.datos()?.incidentesPorEstado, COLOR_ESTADO));
  tipo = computed(() => this.filas(this.datos()?.incidentesPorTipo));
  mes = computed(() => this.filasMes(this.datos()?.incidentesPorMes));

  cambiar(parcial: Partial<DashboardFiltro>): void { 
    this.filtro.update(f => ({ ...f, ...parcial })); 
  }

  // Métodos para el control por año
  toggleFiltroAnio(activado: boolean): void {
    this.filtrarPorAnio.set(activado);
    if (activado) {
      this.aplicarRangoAnio(this.anioFiltro());
    }
  }

  cambiarAnio(valor: string | number): void {
    const anio = Number(valor);
    if (!anio || isNaN(anio)) return;
    this.anioFiltro.set(anio);
    this.aplicarRangoAnio(anio);
  }

  private aplicarRangoAnio(anio: number): void {
    this.cambiar({
      fechaDesde: `${anio}-01-01`,
      fechaHasta: `${anio}-12-31`,
    });
  }

  exportarMetricas(formato: FormatoReporte = 'PDF'): void {
    if (!this.puedeExportar || this.exportando()) return;

    this.exportando.set(true);
    const filtrosActuales = this.filtro();

    this.reporteApi.exportarDashboardMetricas(formato, filtrosActuales).subscribe({
      next: () => {
        this.exportando.set(false);
        this.alert.exito(
          'Reporte descargado',
          `El consolidado de métricas en formato ${formato} se generó con los filtros aplicados.`
        );
      },
      error: (err) => {
        this.exportando.set(false);
        this.alert.error(
          err?.error?.message || `No se pudo generar el consolidado de métricas en ${formato}.`,
          'Error al exportar métricas'
        );
      },
    });
  }

  private filas(mapa?: Record<string, number>, colores?: Record<string, string>): Fila[] {
    const entradas = Object.entries(mapa ?? {});
    const max = Math.max(1, ...entradas.map(([, v]) => v));
    return entradas.map(([k, v]) => ({
      etiqueta: k.replaceAll('_', ' '), 
      valor: v, 
      ancho: (v / max) * 100, 
      color: colores?.[k] ?? '#1976d2',
    }));
  }

  private filasMes(mapa?: Record<string, number>): Fila[] {
    const entradas = Object.entries(mapa ?? {}).sort(([a], [b]) => a.localeCompare(b));
    const max = Math.max(1, ...entradas.map(([, v]) => v));
    return entradas.map(([k, v]) => {
      const [anio, numMes] = k.split('-');
      const etiqueta = numMes && MESES[numMes] ? `${MESES[numMes]} ${anio}` : k;
      return {
        etiqueta,
        valor: v,
        ancho: (v / max) * 100,
        color: '#0288d1'
      };
    });
  }
}