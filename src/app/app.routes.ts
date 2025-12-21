import { Routes } from '@angular/router';
import { LoginComponent } from './modules/public/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  //{
    //path: 'products',
    //component: ProductListComponent,
    //resolve: {
      //products: productsResolver
    //}
  //},
  //{ path: 'products/new', component: ProductCreateComponent },
  //{ path: 'products/:id', component: ProductDetailComponent },
  //{
    //path: 'cart',
    //component: CartComponent,
    //canActivate: [authGuard],
    //canDeactivate: [checkoutGuard]
  //},
  {
    path: 'u',
    loadComponent: () => import('./core/components/navigation/navigation.component')
      .then(m => m.NavigationComponent),
    loadChildren: () => import('./modules/user/user.routes'),
    //canMatch: [authGuard]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
