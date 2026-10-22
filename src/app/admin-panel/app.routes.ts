import { Routes } from '@angular/router';
import { DashBoardSec } from './dash-board-sec/dash-board-sec'; 
import { LowerCloths } from './products/products';
import { Stores } from './stores/stores';
import { AdminOrdersComponent } from './admin-orders/admin-orders'; 

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashBoardSec },
  { path: 'products', component: LowerCloths },
  { path: 'stores', component: Stores },
  { path: 'cloths', component: LowerCloths },
  { path: 'members', component: LowerCloths },
  { path: 'orders', component: AdminOrdersComponent }, // Add this line for the Orders route
];