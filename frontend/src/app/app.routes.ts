import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'home', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'supermarkets', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/supermarkets/supermarkets.component').then(m => m.SupermarketsComponent) 
  },
  { 
    path: 'supermarkets/:id', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/supermarket-detail/supermarket-detail.component').then(m => m.SupermarketDetailComponent) 
  },
  { 
    path: 'products', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent) 
  },
  { 
    path: 'products/compare/:name', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/compare/compare.component').then(m => m.CompareComponent) 
  },
  { 
    path: 'cart', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent) 
  },
  { 
    path: 'orders', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent) 
  },
  { 
    path: 'orders/:id', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent) 
  },
  { 
    path: 'profile', 
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) 
  },
  { 
    path: 'access-denied', 
    loadComponent: () => import('./pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent) 
  },
  { path: '**', redirectTo: '/home' }
];
