import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DetalhesLivroPageRoutingModule } from './detalhes-livro-routing.module';
import { DetalhesLivroPage } from './detalhes-livro.page';

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule, DetalhesLivroPageRoutingModule],
  declarations: [DetalhesLivroPage],
})
export class DetalhesLivroPageModule {}

