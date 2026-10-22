import { Routes } from '@angular/router';

import { WebsiteLayout } from './layouts/website-layout/website-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { LoginAdmin } from './admin-panel/login-admin/login-admin';
import { RoleAuthGuard } from './services/auth-service';

export const routes: Routes = [

  // ========================= WEB =========================
  {  path: '', component: WebsiteLayout, loadChildren: () => import('./web/app.routes').then(w => w.WebRoutes) },

  // ========================= ADMIN LOGIN =========================
  { path: 'admin-login', component: LoginAdmin },

  // ========================= ADMIN PANEL =========================
{
    path: 'admin',
    component: AdminLayout,
    canActivate: [RoleAuthGuard],       // Root admin access protect karein
    canActivateChild: [RoleAuthGuard],  // Sub-routes access protect karein
    data: { role: ['admin'] },
    loadChildren: () => import('./admin-panel/app.routes').then((a) => a.adminRoutes),
  },

  { path: 'unauthorized', redirectTo: 'home' },
  { path: '**', redirectTo: '' }

];