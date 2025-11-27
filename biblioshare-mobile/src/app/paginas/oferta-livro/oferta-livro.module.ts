import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OfertaLivroPageRoutingModule } from './oferta-livro-routing.module';

import { OfertaLivroPage } from './oferta-livro.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OfertaLivroPageRoutingModule,
    OfertaLivroPage,
  ],
})
export class OfertaLivroPageModule {}

