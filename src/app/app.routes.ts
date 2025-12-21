import { Routes } from '@angular/router';
import { LoginComponent } from './modules/public/login/login.component';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'u',
    loadComponent: () => import('./core/components/navigation/navigation.component')
      .then(m => m.NavigationComponent),
    loadChildren: () => import('./modules/user/user.routes'),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
