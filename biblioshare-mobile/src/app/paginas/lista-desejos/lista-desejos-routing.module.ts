import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ListaDesejosPage } from './lista-desejos.page';

const routes: Routes = [
  {
    path: '',
    component: ListaDesejosPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListaDesejosPageRoutingModule {}

