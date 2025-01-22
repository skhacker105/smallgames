import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SnakesComponent } from './snakes/snakes.component';

const routes: Routes = [
  {
    path: '',
    component: SnakesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SnakesRoutingModule { }
