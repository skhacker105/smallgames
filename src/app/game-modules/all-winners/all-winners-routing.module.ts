import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllWinnersComponent } from './all-winners/all-winners.component';

const routes: Routes = [
  {
    path: '',
    component: AllWinnersComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AllWinnersRoutingModule { }
