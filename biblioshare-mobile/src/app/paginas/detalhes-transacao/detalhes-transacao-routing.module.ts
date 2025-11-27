import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DetalhesTransacaoPage } from './detalhes-transacao.page';

const routes: Routes = [
  {
    path: '',
    component: DetalhesTransacaoPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetalhesTransacaoPageRoutingModule {}

