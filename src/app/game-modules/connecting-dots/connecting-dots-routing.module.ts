import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConnectingDotsComponent } from './connecting-dots/connecting-dots.component';

const routes: Routes = [
  {
    path: '',
    component: ConnectingDotsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConnectingDotsRoutingModule { }
