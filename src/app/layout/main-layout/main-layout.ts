import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { Auth } from '../../core/auth/auth';
import { Rol } from '../../core/auth/auth.models';

export interface MenuItem {
  label: string;
  icon: string;
  ruta: string;
  roles: Rol[];
  seccion?: string;
}

const ROL_ADMIN: Rol[] = ['ROLE_ADMINISTRADOR'];
const ROL_TUTOR: Rol[] = ['ROLE_TUTOR'];
const ADMIN_Y_TUTOR: Rol[] = ['ROLE_ADMINISTRADOR', 'ROLE_TUTOR'];
const TODOS_LOS_ROLES: Rol[] = ['ROLE_ADMINISTRADOR', 'ROLE_TUTOR', 'ROLE_PSICOLOGO'];

export const MENU_ITEMS: MenuItem[] = [
  // --- Convivencia Escolar ---
  { label: 'Incidencias', icon: 'folder_open', ruta: '/incidencias', roles: TODOS_LOS_ROLES, seccion: 'Convivencia' },
  { label: 'Nueva incidencia', icon: 'add_circle', ruta: '/incidencias/nueva', roles: ROL_TUTOR, seccion: 'Convivencia' },
  { label: 'Notificaciones', icon: 'notifications', ruta: '/notificaciones', roles: ADMIN_Y_TUTOR, seccion: 'Convivencia' },

  // --- Padrón Escolar ---
  { label: 'Estudiantes', icon: 'school', ruta: '/estudiantes', roles: ADMIN_Y_TUTOR, seccion: 'Padrón Escolar' },
  { label: 'Apoderados', icon: 'family_restroom', ruta: '/apoderados', roles: ADMIN_Y_TUTOR, seccion: 'Padrón Escolar' },

  // --- Reportes y SíSeVe ---
  { label: 'Derivaciones SíSeVe', icon: 'send', ruta: '/derivaciones', roles: ROL_ADMIN, seccion: 'Reportes y SíSeVe' },
  { label: 'Indicadores', icon: 'dashboard', ruta: '/dashboard', roles: ROL_ADMIN, seccion: 'Reportes y SíSeVe' },
  /*{ label: 'Reportes', icon: 'assessment', ruta: '/reportes', roles: ROL_ADMIN, seccion: 'Reportes y SíSeVe' },*/

  // --- Configuración y Administración ---
  { label: 'Asignación Aulas', icon: 'meeting_room', ruta: '/admin/tutor-aulas', roles: ROL_ADMIN, seccion: 'Configuración' },
  { label: 'Tipos de incidencia', icon: 'category', ruta: '/admin/tipos-incidencia', roles: ROL_ADMIN, seccion: 'Configuración' },
  { label: 'Usuarios y Roles', icon: 'manage_accounts', ruta: '/admin/usuarios', roles: ROL_ADMIN, seccion: 'Configuración' },
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  readonly auth = inject(Auth);
  readonly expandido = signal(true);

  // Obtiene el rol único normalizado
  readonly rolActual = computed<Rol | null>(() => {
    const rawRol = (this.auth.usuario() as any)?.rol;
    if (!rawRol) return null;
    return typeof rawRol === 'object' ? rawRol.nombre : rawRol;
  });

  // Filtra los ítems según el rol del usuario
  readonly items = computed(() => {
    const miRol = this.rolActual();
    if (!miRol) return [];
    return MENU_ITEMS.filter((item) => item.roles.includes(miRol));
  });

  readonly nombreUsuario = computed(() => {
    return this.auth.usuario()?.nombres?.split(' ')[0] ?? 'Usuario';
  });

  readonly nombreUsuarioCompleto = computed(() => {
    const u = this.auth.usuario();
    return u ? `${u.nombres} ${u.apellidos}` : 'Usuario';
  });

  readonly rolDisplay = computed(() => {
    switch (this.rolActual()) {
      case 'ROLE_ADMINISTRADOR':
        return 'Administrador';
      case 'ROLE_PSICOLOGO':
        return 'Psicólogo';
      case 'ROLE_TUTOR':
        return 'Tutor';
      default:
        return 'Personal';
    }
  });
}