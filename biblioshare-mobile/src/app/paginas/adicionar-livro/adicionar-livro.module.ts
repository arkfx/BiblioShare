import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AdicionarLivroPageRoutingModule } from './adicionar-livro-routing.module';
import { AdicionarLivroPage } from './adicionar-livro.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AdicionarLivroPageRoutingModule,
    AdicionarLivroPage,
  ],
})
export class AdicionarLivroPageModule {}

