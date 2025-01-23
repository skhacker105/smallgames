import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LudoComponent } from './ludo/ludo.component';

const routes: Routes = [
  {
    path: '',
    component: LudoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LudoRoutingModule { }
