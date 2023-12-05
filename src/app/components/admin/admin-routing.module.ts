import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin.component';
import { CanvasComponent } from './canvas/canvas.component';
import { AuthGuard } from '../../guards';

const routes: Routes = [
  { path: '', component: AdminComponent, canActivate: [AuthGuard]},
  { path: 'measurement', component: CanvasComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
