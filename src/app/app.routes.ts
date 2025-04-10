import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home/home.component').then(
        (m) => m.HomeComponent
      ),
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '' },
];
