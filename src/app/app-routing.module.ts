import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlashSwapComponent } from './flash-swap/flash-swap.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ServiceUnavailableComponent } from './service-unavailable/service-unavailable.component';

const routes: Routes = [
  {
    component: FlashSwapComponent,
    path: 'swap',
  },
  {
    component: ServiceUnavailableComponent,
    path: 'unavailable',
  },
  { path: '', redirectTo: '/swap', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
