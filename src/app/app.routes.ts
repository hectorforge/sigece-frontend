import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

// Componente provisional para las vistas aún en desarrollo
const placeholder = () => import('./shared/placeholder/placeholder').then((m) => m.Placeholder);

const ROL_ADMIN = ['ROLE_ADMINISTRADOR'];
const ADMIN_Y_TUTOR = ['ROLE_ADMINISTRADOR', 'ROLE_TUTOR'];
const TODOS_LOS_ROLES = ['ROLE_ADMINISTRADOR', 'ROLE_TUTOR', 'ROLE_PSICOLOGO'];

export const routes: Routes = [
  // -------------------------------------------------------------------------
  // AUTENTICACIÓN PÚBLICA
  // -------------------------------------------------------------------------
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    data: { titulo: 'Iniciar Sesión' },
  },

  // -------------------------------------------------------------------------
  // ÁREA PRIVADA (PROTEGIDA POR AUTHGUARD Y MAINLAYOUT)
  // -------------------------------------------------------------------------
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'incidencias' },

      // =====================================================================
      // 1. CONVIVENCIA ESCOLAR (INCIDENCIAS Y SEGUIMIENTO)
      // =====================================================================

      // CU11 (Tutor), CU16 (Tutor/Psicólogo), CU19 (Admin cierre)
      {
        path: 'incidencias',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/incidencias/incidencia-list/incidencia-list').then((m) => m.IncidenciaList),
        data: { titulo: 'Bandeja de Incidencias', roles: TODOS_LOS_ROLES },
      },

      // CU10. Registrar incidencia -> EXCLUSIVO DEL TUTOR (Según diagrama)
      {
        path: 'incidencias/nueva',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/incidencias/incidencia-form/incidencia-form').then((m) => m.IncidenciaForm),
        data: { titulo: 'Registrar Incidencia', roles: ['ROLE_TUTOR'] },
      },

      // CU16. Expediente completo, Involucrados, Evidencias y Seguimiento (CU15)
      {
        path: 'incidencias/:id',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/incidencias/incidencia-detalle/incidencia-detalle').then((m) => m.IncidenciaDetalle),
        data: { titulo: 'Expediente del Caso', roles: TODOS_LOS_ROLES },
      },

      // [PENDIENTE] CU18. Consulta de notificaciones enviadas
      // TODO: Crear componente features/notificaciones/notificacion-list
      {
        path: 'notificaciones',
        canActivate: [roleGuard],
        loadComponent: placeholder,
        data: { titulo: 'Historial de Notificaciones (CU18)', roles: ADMIN_Y_TUTOR },
      },

      // =====================================================================
      // 2. PADRÓN ESCOLAR
      // =====================================================================

      // CU04 (Admin) y CU05 (Tutor - Solo sus secciones)
      {
        path: 'estudiantes',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/estudiantes/estudiante-list/estudiante-list').then((m) => m.EstudianteList),
        data: { titulo: 'Padrón de Estudiantes', roles: ADMIN_Y_TUTOR },
      },
      {
        path: 'estudiantes/:id',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/estudiantes/estudiante-perfil/estudiante-perfil').then((m) => m.EstudiantePerfil),
        data: { titulo: 'Ficha del Estudiante', roles: ADMIN_Y_TUTOR },
      },

      // CU06 (Admin) y CU07 (Tutor)
      {
        path: 'apoderados',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/apoderados/apoderado-list/apoderado-list').then((m) => m.ApoderadoList),
        data: { titulo: 'Directorio de Apoderados', roles: ADMIN_Y_TUTOR },
      },

      // =====================================================================
      // 3. ANALÍTICA, SÍSEVE Y REPORTES
      // =====================================================================

      // [PENDIENTE] CU20 y CU21. Derivaciones a SíSeVe
      // TODO: Crear componente features/derivaciones/derivacion-list
      {
        path: 'derivaciones',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/derivaciones/derivacion-list/derivacion-list').then((m) => m.DerivacionList),
        data: { titulo: 'Derivaciones SíSeVe (CU21)', roles: ROL_ADMIN },
      },

      // CU22. Indicadores del Dashboard
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/dashboard/dashboard/dashboard').then((m) => m.Dashboard),
        data: { titulo: 'Panel de Indicadores', roles: ROL_ADMIN },
      },

      // [PENDIENTE] CU22. Reportes consolidados exportables
      // TODO: Crear componente features/reportes/reporte-generador
      /*
      {
        path: 'reportes',
        canActivate: [roleGuard],
        loadComponent: placeholder,
        data: { titulo: 'Generador de Reportes (CU22)', roles: ROL_ADMIN },
      },*/

      // =====================================================================
      // 4. ADMINISTRACIÓN Y CONFIGURACIÓN INSTITUCIONAL
      // =====================================================================

      // CU01, CU02 y CU03. Mantenimiento de usuarios y asignación de roles
      {
        path: 'admin/usuarios',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/usuarios/usuario-list/usuario-list').then((m) => m.UsuarioList),
        data: { titulo: 'Gestión de Usuarios y Roles (CU01/CU02)', roles: ROL_ADMIN },
      },

      // CU08 y CU09. Catálogo de violencia escolar homologado SíSeVe
      {
        path: 'admin/tipos-incidencia',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/tipos-incidencia/tipo-incidencia-list/tipo-incidencia-list').then((m) => m.TipoIncidenciaList),
        data: { titulo: 'Catálogo de Tipologías (CU08/CU09)', roles: ROL_ADMIN },
      },

      // [PENDIENTE] Base de RN04: Asignación de nivel, grado y sección a tutores
      // TODO: Crear componente features/admin/tutor-aulas/tutor-aula-list
      {
        path: 'admin/tutor-aulas',
        canActivate: [roleGuard],
        loadComponent: () => import('./features/aula/aula-list/aula-list').then((m) => m.AulaList),
        data: { titulo: 'Asignación de Aulas a Tutores', roles: ROL_ADMIN },
      },

      // =====================================================================
      // 5. CUENTA DE USUARIO Y ERRORES
      // =====================================================================

      // [PENDIENTE] Perfil del usuario autenticado (llamado desde el menú superior)
      // TODO: Crear componente features/perfil/perfil-usuario
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
        data: { titulo: 'Mi Perfil' },
      },

      // [PENDIENTE] Pantalla 403 amigable para accesos no autorizados
      // TODO: Crear componente shared/forbidden/forbidden-page
      {
        path: '403',
        loadComponent: placeholder,
        data: { titulo: '403 - Acceso Denegado' },
      },
    ],
  },

  // -------------------------------------------------------------------------
  // RUTA COMODÍN (NOT FOUND)
  // -------------------------------------------------------------------------
  { path: '**', redirectTo: '' },
];