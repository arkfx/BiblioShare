import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PropostaTrocaPage } from './proposta-troca.page';

const routes: Routes = [
  {
    path: '',
    component: PropostaTrocaPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PropostaTrocaPageRoutingModule {}

