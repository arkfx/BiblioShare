import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { OfertaLivroPage } from './oferta-livro.page';

const routes: Routes = [
  {
    path: '',
    component: OfertaLivroPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OfertaLivroPageRoutingModule {}

