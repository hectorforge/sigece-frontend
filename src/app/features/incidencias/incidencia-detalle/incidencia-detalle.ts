import { DatePipe, CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Observable,
  catchError,
  filter,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import Swal from 'sweetalert2';

import { Auth } from '../../../core/auth/auth';
import { GRAVEDADES } from '../../../core/models/enums';
import {
  AdjuntoResponseDto,
  InvolucradoResponseDto,
  IncidenteExpedienteResponseDto,
  ReincidenciaResponseDto,
} from '../../../core/models/incidente.models';
import { IncidenteApi } from '../../../core/services/incidente-api';
import { AccionSeguimientoApi } from '../../../core/services/accion-seguimiento-api';
import { AlertService } from '../../../core/services/alert.service';

import {
  AccionEstadoRequestDto,
  AccionRevisionRequestDto,
  AccionSeguimientoRequestDto,
  AccionSeguimientoResponseDto,
  EstadoAccion,
  TipoAccion,
} from '../../../core/models/accion.models';

import {
  AccionData,
  AccionDialog,
} from '../../../shared/accion-dialog/accion-dialog';
import { EstadoChip } from '../../../shared/estado-chip/estado-chip';
import { GravedadChip } from '../../../shared/gravedad-chip/gravedad-chip';
import { MotivoDialog } from '../../../shared/motivo-dialog/motivo-dialog';
import { InvolucradoDialog } from '../involucrado-dialog/involucrado-dialog';
import { EvidenciaDialog } from '../evidencia-dialog/evidencia-dialog';
import { AsignarResponsableDialog } from '../asignar-responsable-dialog/asignar-responsable-dialog';

function aLocalDateString(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;
  const d = new Date(valor);
  if (isNaN(d.getTime())) return null;
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function aOffsetDateTimeString(valor: Date | string | null | undefined): string | null {
  if (!valor) return null;
  const d = new Date(valor);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

@Component({
  selector: 'app-incidencia-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    GravedadChip,
    EstadoChip,
  ],
  templateUrl: './incidencia-detalle.html',
  styleUrl: './incidencia-detalle.css',
})
export class IncidenciaDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(IncidenteApi);
  private readonly accionesApi = inject(AccionSeguimientoApi);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(Auth);
  private readonly alert = inject(AlertService);

  readonly id = this.route.snapshot.paramMap.get('id')!;
  private readonly recarga = signal(0);

  readonly esAdmin = this.auth.tieneRol(['ROLE_ADMINISTRADOR']);
  readonly esTutor = this.auth.tieneRol(['ROLE_TUTOR']);
  readonly esPsicologo = this.auth.tieneRol(['ROLE_PSICOLOGO']);

  readonly puedeModificarIncidente = this.esAdmin || this.esPsicologo;
  readonly puedeGestionarInvolucrados = this.esTutor;
  readonly puedeSubirEvidencia = this.esTutor;
  readonly puedeEliminarEvidencia = this.esAdmin || this.esTutor;
  readonly puedeVerificarIntegridad = this.esAdmin || this.esPsicologo;
  readonly puedeRegistrarSeguimiento = this.esPsicologo;
  readonly puedeVerNotificaciones = this.esAdmin || this.esTutor;
  readonly puedeAsignarResponsable = this.esAdmin;

  readonly columnasInvolucrados: string[] = [
    'rol',
    'nombre',
    'documento',
    'observaciones',
    'reincidencia',
    'acciones',
  ];

  readonly columnasEvidencias: string[] = ['archivo', 'tamano', 'subido', 'acciones'];

  readonly columnasSeguimiento: string[] = this.esPsicologo
    ? ['fecha', 'tipo', 'descripcion', 'usuario', 'revision', 'estado', 'acciones']
    : ['fecha', 'tipo', 'descripcion', 'usuario', 'revision', 'estado'];

  readonly columnasNotificaciones: string[] = ['tipo', 'apoderado', 'canal', 'envio', 'estado'];

  readonly estado = signal<'cargando' | 'ok' | 'error'>('cargando');

  tamano(bytes: number): string {
    return bytes >= 1048576
      ? (bytes / 1048576).toFixed(1) + ' MB'
      : Math.max(1, Math.round(bytes / 1024)) + ' KB';
  }

  readonly expediente = toSignal(
    toObservable(this.recarga).pipe(
      switchMap(() =>
        this.api.obtener(this.id).pipe(
          switchMap((expediente: IncidenteExpedienteResponseDto) => {
            if (!expediente) return of(null);
            return this.accionesApi.listarPorIncidente(this.id).pipe(
              map((seguimiento: AccionSeguimientoResponseDto[]) => ({
                ...expediente,
                seguimiento,
              })),
              catchError(() => of(expediente))
            );
          }),
          tap((expediente) => {
            if (expediente) this.estado.set('ok');
          }),
          catchError(() => {
            this.estado.set('error');
            return of(null);
          })
        )
      )
    ),
    { initialValue: null }
  );

  readonly transiciones = toSignal(
    toObservable(this.recarga).pipe(
      switchMap(() => this.api.transiciones(this.id).pipe(catchError(() => of([])))),
      map((lista) => lista.filter((estado) => estado !== 'RESUELTO' && estado !== 'CERRADO'))
    ),
    { initialValue: [] }
  );

  private refrescar(mensaje: string, detalle = ''): void {
    this.alert.exito(mensaje, detalle);
    this.recarga.update((n) => n + 1);
  }

  // =========================================================================
  // ASIGNAR / REASIGNAR RESPONSABLE MEDIANTE AUTOCOMPLETE
  // =========================================================================

  asignarResponsable(esReasignacion = false): void {
    if (!this.puedeAsignarResponsable) return;

    this.dialog
      .open(AsignarResponsableDialog, {
        width: '520px',
        data: { esReasignacion },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((res: { responsableId: number; motivo?: string }) =>
          this.api.asignarResponsable(this.id, res)
        )
      )
      .subscribe({
        next: () =>
          this.refrescar(
            esReasignacion ? 'Responsable reasignado' : 'Responsable asignado',
            esReasignacion
              ? 'El expediente fue transferido al nuevo responsable correctamente.'
              : 'El responsable fue asignado e inició la etapa de investigación.'
          ),
        error: (err) =>
          this.alert.error(
            err?.error?.message ?? err?.message ?? 'No se pudo asignar al responsable.',
            'Error de asignación'
          ),
      });
  }

  // =========================================================================
  // EVALUAR REINCIDENCIA
  // =========================================================================

  evaluarReincidencia(involucrado: InvolucradoResponseDto): void {
    if (!involucrado.estudianteId) {
      this.alert.aviso('Solo se puede evaluar reincidencia en estudiantes registrados.', 'Atención');
      return;
    }

    this.api.evaluarReincidencia({ estudianteId: involucrado.estudianteId }).subscribe({
      next: (res: ReincidenciaResponseDto) => {
        if (res.superaUmbral) {
          Swal.fire({
            icon: 'warning',
            title: '¡Alerta de Reincidencia!',
            html: `
              <p>El estudiante <strong>${involucrado.nombreCompleto}</strong> registra <strong>${res.totalIncidentesEnPeriodo}</strong> incidentes en los últimos <strong>${res.periodoDiasEvaluado} días</strong>.</p>
              <p style="color: #b91c1c; font-weight: bold;">Supera el umbral de alerta (${res.umbralConfigurado} incidentes). Se recomienda atención inmediata del psicólogo.</p>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#b91c1c',
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: 'Historial de Reincidencia',
            html: `
              <p>Estudiante: <strong>${involucrado.nombreCompleto}</strong></p>
              <p>Incidentes en los últimos 30 días: <strong>${res.totalIncidentesEnPeriodo}</strong> (Umbral: ${res.umbralConfigurado}).</p>
              <p style="color: #15803d;">Dentro del parámetro normal.</p>
            `,
            confirmButtonText: 'Aceptar',
          });
        }
      },
      error: () => this.alert.error('No se pudo consultar el historial de reincidencia.'),
    });
  }

  // =========================================================================
  // INVOLUCRADOS
  // =========================================================================

  agregarInvolucrado(): void {
    if (!this.puedeGestionarInvolucrados) return;

    this.dialog
      .open(InvolucradoDialog, { width: '520px' })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((r: any) => this.api.agregarInvolucrado(this.id, r.dto))
      )
      .subscribe({
        next: () => this.refrescar('Involucrado agregado', 'Se agregó correctamente al expediente.'),
        error: (err) => this.alert.error(err?.error?.message ?? err?.message ?? 'No se pudo registrar al involucrado'),
      });
  }

  async retirar(p: InvolucradoResponseDto): Promise<void> {
    if (!this.puedeGestionarInvolucrados) return;

    const confirmado = await this.alert.confirmarPeligro(
      `¿Retirar a ${p.nombreCompleto}?`,
      'Esta acción desvinculará a la persona del expediente del caso.',
      'Sí, continuar con el retiro'
    );

    if (!confirmado) return;

    this.dialog
      .open(MotivoDialog, {
        width: '480px',
        data: {
          titulo: `Retirar a ${p.nombreCompleto}`,
          etiqueta: 'Motivo del retiro',
          confirmar: 'Retirar',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((motivo: string) => this.api.retirarInvolucrado(this.id, p.id, motivo))
      )
      .subscribe({
        next: () => this.refrescar('Involucrado retirado', `${p.nombreCompleto} fue retirado del caso.`),
        error: (err) => this.alert.error(err?.error?.message ?? err?.message ?? 'No se pudo retirar al involucrado'),
      });
  }

  // =========================================================================
  // EVIDENCIAS
  // =========================================================================

  subirEvidencia(): void {
    if (!this.puedeSubirEvidencia) return;

    this.dialog
      .open(EvidenciaDialog, { width: '520px' })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((r: any) => this.api.subirEvidencia(this.id, r.archivo, r.descripcion))
      )
      .subscribe({
        next: () => this.refrescar('Evidencia cargada', 'El archivo fue almacenado de manera segura.'),
        error: (e) =>
          this.alert.error(
            e?.error?.error?.message ?? e?.error?.message ?? e?.message ?? 'No se pudo subir la evidencia',
            'Error al cargar archivo'
          ),
      });
  }

  descargar(a: AdjuntoResponseDto): void {
    this.api.urlDescarga(a.id).subscribe({
      next: (url) => window.open(url, '_blank'),
      error: (e) => this.alert.error(e?.message ?? 'No se pudo generar el enlace de descarga.', 'Error de descarga'),
    });
  }

  verificar(a: AdjuntoResponseDto): void {
    if (!this.puedeVerificarIntegridad) return;

    this.api.verificarIntegridad(a.id).subscribe({
      next: (r) => {
        if (r.integro) {
          this.alert.exito(
            'Evidencia íntegra (SHA-256)',
            `El archivo "${a.nombreOriginal}" coincide exactamente con su firma criptográfica registrada.`
          );
        } else {
          this.alert.error(
            `El archivo "${a.nombreOriginal}" difiere de su hash original. Podría haber sido alterado.`,
            '¡Alerta de Integridad!'
          );
        }
      },
      error: () => this.alert.error('No se pudo verificar la integridad criptográfica de la evidencia.'),
    });
  }

  async eliminarEvidencia(a: AdjuntoResponseDto): Promise<void> {
    if (!this.puedeEliminarEvidencia) return;

    const confirmado = await this.alert.confirmarPeligro(
      `¿Eliminar evidencia "${a.nombreOriginal}"?`,
      'El archivo será retirado del expediente y del almacenamiento permanente.',
      'Sí, eliminar evidencia'
    );

    if (!confirmado) return;

    this.dialog
      .open(MotivoDialog, {
        width: '480px',
        data: {
          titulo: `Eliminar ${a.nombreOriginal}`,
          etiqueta: 'Motivo de eliminación',
          confirmar: 'Eliminar',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((motivo: string) => this.api.eliminarEvidencia(a.id, motivo))
      )
      .subscribe({
        next: () => this.refrescar('Evidencia eliminada', 'El archivo fue eliminado del expediente.'),
        error: (err) => this.alert.error(err?.error?.message ?? err?.message ?? 'No se pudo eliminar la evidencia'),
      });
  }

  // =========================================================================
  // SEGUIMIENTO
  // =========================================================================

  registrarAccionSeguimiento(): void {
    if (!this.esPsicologo) return;

    this.abrir(
      {
        titulo: 'Registrar acción de seguimiento',
        confirmar: 'Registrar acción',
        campos: [
          {
            nombre: 'tipoAccion',
            etiqueta: 'Tipo de acción',
            tipo: 'select',
            requerido: true,
            opciones: [
              { valor: 'ENTREVISTA_ESTUDIANTE', texto: 'Entrevista al estudiante' },
              { valor: 'ENTREVISTA_PADRES', texto: 'Entrevista a los padres' },
              { valor: 'CITACION_APODERADO', texto: 'Citación al apoderado' },
              { valor: 'DERIVACION_PSICOLOGIA', texto: 'Derivación a psicología' },
              { valor: 'MEDIDA_CORRECTIVA_FORMATIVA', texto: 'Medida correctiva o formativa' },
              { valor: 'DERIVACION_DEMUNA_CEM', texto: 'Derivación a DEMUNA/CEM' },
              { valor: 'ACTA_COMPROMISO', texto: 'Acta de compromiso' },
              { valor: 'APUNTE_INTERNO', texto: 'Apunte interno' },
              { valor: 'OTRO', texto: 'Otro' },
            ],
          },
          {
            nombre: 'descripcion',
            etiqueta: 'Descripción de la acción',
            tipo: 'area',
            requerido: true,
            minimo: 5,
          },
          {
            nombre: 'fechaProgramada',
            etiqueta: 'Fecha y hora programadas',
            tipo: 'fecha',
            requerido: false,
          },
          {
            nombre: 'fechaProximaRevision',
            etiqueta: 'Fecha de próxima revisión',
            tipo: 'fecha',
            requerido: false,
          },
        ],
      },
      (v) => {
        const requestDto: AccionSeguimientoRequestDto = {
          tipoAccion: v.tipoAccion as TipoAccion,
          descripcion: v.descripcion,
          fechaProgramada: aOffsetDateTimeString(v.fechaProgramada),
          fechaProximaRevision: aLocalDateString(v.fechaProximaRevision),
        };
        return this.accionesApi.registrar(this.id, requestDto).pipe(map(() => void 0));
      },
      'Acción registrada',
      'La acción de seguimiento se guardó en el expediente.'
    );
  }

  actualizarEstadoAccion(accion: AccionSeguimientoResponseDto): void {
    if (!this.esPsicologo) return;

    this.abrir(
      {
        titulo: 'Actualizar estado de la acción',
        confirmar: 'Guardar estado',
        campos: [
          {
            nombre: 'nuevoEstado',
            etiqueta: 'Nuevo estado',
            tipo: 'select',
            requerido: true,
            valor: accion.estadoAccion,
            opciones: [
              { valor: 'PENDIENTE', texto: 'Pendiente' },
              { valor: 'EN_PROCESO', texto: 'En proceso' },
              { valor: 'COMPLETADA', texto: 'Completada' },
            ],
          },
          {
            nombre: 'comentarioEjecucion',
            etiqueta: 'Comentarios de ejecución o cierre',
            tipo: 'area',
            requerido: false,
          },
        ],
      },
      (v) => {
        const dto: AccionEstadoRequestDto = {
          nuevoEstado: v.nuevoEstado as EstadoAccion,
          comentarioEjecucion: v.comentarioEjecucion?.trim() || undefined,
        };
        return this.accionesApi.actualizarEstado(accion.id, dto).pipe(map(() => void 0));
      },
      'Estado actualizado',
      'El estado de la acción fue modificado.'
    );
  }

  reprogramarAccion(accion: AccionSeguimientoResponseDto): void {
    if (!this.esPsicologo) return;

    this.abrir(
      {
        titulo: 'Reprogramar próxima revisión',
        confirmar: 'Reprogramar',
        campos: [
          {
            nombre: 'nuevaFechaRevision',
            etiqueta: 'Nueva fecha de revisión',
            tipo: 'fecha',
            requerido: true,
          },
          {
            nombre: 'justificacion',
            etiqueta: 'Justificación de la postergación',
            tipo: 'area',
            requerido: true,
          },
        ],
      },
      (v) => {
        const parsedFecha = aLocalDateString(v.nuevaFechaRevision);
        if (!parsedFecha) throw new Error('Fecha no válida');

        const dto: AccionRevisionRequestDto = {
          nuevaFechaRevision: parsedFecha,
          justificacion: v.justificacion,
        };
        return this.accionesApi.reprogramarRevision(accion.id, dto).pipe(map(() => void 0));
      },
      'Revisión reprogramada',
      'Se actualizó la fecha de seguimiento.'
    );
  }

  // =========================================================================
  // TRANSICIONES Y CIERRE
  // =========================================================================

  private abrir(
    data: AccionData,
    llamada: (v: any) => Observable<void>,
    tituloExito: string,
    detalleExito = ''
  ): void {
    this.dialog
      .open(AccionDialog, { data, width: '520px' })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(llamada)
      )
      .subscribe({
        next: () => this.refrescar(tituloExito, detalleExito),
        error: (err) =>
          this.alert.error(
            err?.error?.error?.message ?? err?.error?.message ?? err?.message ?? 'Ocurrió un error al procesar la acción',
            'No se pudo completar la operación'
          ),
      });
  }

  cambiarEstado(): void {
    this.abrir(
      {
        titulo: 'Cambiar estado del incidente',
        confirmar: 'Cambiar estado',
        campos: [
          {
            nombre: 'nuevoEstado',
            etiqueta: 'Nuevo estado',
            tipo: 'select',
            requerido: true,
            opciones: this.transiciones().map((e) => ({
              valor: e,
              texto: e.replaceAll('_', ' '),
            })),
          },
          {
            nombre: 'motivo',
            etiqueta: 'Motivo del cambio de estado',
            tipo: 'area',
            requerido: true,
          },
        ],
      },
      (v) => this.api.cambiarEstado(this.id, v.nuevoEstado, v.motivo).pipe(map(() => void 0)),
      'Estado actualizado',
      'El incidente cambió de estado correctamente.'
    );
  }

  cambiarGravedad(actual: string): void {
    this.abrir(
      {
        titulo: 'Cambiar gravedad',
        confirmar: 'Actualizar gravedad',
        campos: [
          {
            nombre: 'gravedad',
            etiqueta: 'Gravedad',
            tipo: 'select',
            requerido: true,
            valor: actual,
            opciones: GRAVEDADES.map((g) => ({
              valor: g,
              texto: g.replace('_', ' '),
            })),
          },
          {
            nombre: 'justificacion',
            etiqueta: 'Justificación del cambio',
            tipo: 'area',
            requerido: true,
          },
        ],
      },
      (v) => this.api.clasificarGravedad(this.id, v.gravedad, v.justificacion).pipe(map(() => void 0)),
      'Gravedad actualizada',
      'Se modificó el nivel de gravedad del incidente.'
    );
  }

  async resolver(): Promise<void> {
    const confirmar = await this.alert.confirmar(
      '¿Marcar caso como resuelto?',
      'El caso pasará a estado RESUELTO y quedará listo para la emisión del acta de cierre definitiva.',
      'Sí, marcar como resuelto'
    );

    if (!confirmar) return;

    this.abrir(
      {
        titulo: 'Confirmar resolución del caso',
        mensaje: 'Registra observaciones finales antes del cierre con acta.',
        confirmar: 'Guardar resolución',
        campos: [
          {
            nombre: 'observaciones',
            etiqueta: 'Observaciones de resolución (opcional)',
            tipo: 'area',
          },
        ],
      },
      (v) => this.api.resolver(this.id, v.observaciones || undefined).pipe(map(() => void 0)),
      'Caso resuelto',
      'El incidente se encuentra marcado como resuelto.'
    );
  }

  cerrar(): void {
    this.api.checklistCierre(this.id).subscribe(async (c) => {
      if (c.observacionesPendientes?.length) {
        this.alert.aviso(
          'Antes de cerrar el caso debes subsanar:\n• ' + c.observacionesPendientes.join('\n• '),
          'Pendientes de Cierre'
        );
        return;
      }

      const confirmado = await this.alert.confirmarPeligro(
        '¿Cerrar caso definitivamente?',
        'El cierre del caso es irreversible. Deberás adjuntar el acta y las conclusiones formales.',
        'Sí, proceder al cierre'
      );

      if (!confirmado) return;

      this.abrir(
        {
          titulo: 'Acta y Cierre Definitivo del Caso',
          mensaje: 'El cierre es formal y definitivo. Registra el acta y las conclusiones institucionales.',
          confirmar: 'Cerrar caso definitivamente',
          campos: [
            {
              nombre: 'actaCierre',
              etiqueta: 'Texto o número del Acta de cierre',
              tipo: 'area',
              requerido: true,
              minimo: 10,
            },
            {
              nombre: 'conclusionesFinales',
              etiqueta: 'Conclusiones y compromisos finales',
              tipo: 'area',
              requerido: true,
            },
          ],
        },
        (v) => this.api.cerrar(this.id, v.actaCierre, v.conclusionesFinales).pipe(map(() => void 0)),
        '¡Caso cerrado!',
        'El expediente fue formalmente concluido y archivado.'
      );
    });
  }

  derivarSiseve(): void {
    this.abrir(
      {
        titulo: 'Registrar derivación a SíSeVe',
        confirmar: 'Registrar derivación',
        campos: [
          {
            nombre: 'codigoSiseve',
            etiqueta: 'Código SíSeVe emitido por el portal',
            tipo: 'texto',
            requerido: true,
          },
          {
            nombre: 'fecha',
            etiqueta: 'Fecha y hora del reporte',
            tipo: 'fecha',
            requerido: true,
          },
          {
            nombre: 'observaciones',
            etiqueta: 'Observaciones de la derivación (opcional)',
            tipo: 'area',
          },
        ],
      },
      (v) =>
        this.api
          .derivarSiseve(
            this.id,
            v.codigoSiseve,
            new Date(v.fecha).toISOString(),
            v.observaciones || undefined
          )
          .pipe(map(() => void 0)),
      'Derivación registrada',
      'El caso quedó formalmente vinculado al portal SíSeVe del MINEDU.'
    );
  }
}