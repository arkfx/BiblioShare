import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { Livro } from '../../core/modelos/livros';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-proposta-troca',
  templateUrl: './proposta-troca.page.html',
  styleUrls: ['./proposta-troca.page.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class PropostaTrocaPage {
  formulario: FormGroup;
  livroDestino?: Livro;
  meusLivros: Livro[] = [];
  carregandoLivros = false;
  enviando = false;

  constructor(
    private readonly router: Router,
    private readonly navController: NavController,
    private readonly toastController: ToastController,
    private readonly formBuilder: FormBuilder,
    private readonly apiService: ApiService,
  ) {
    this.formulario = this.formBuilder.group({
      livro_oferecido_id: [null, Validators.required],
    });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.resgatarLivroDestino();
    if (!this.livroDestino) {
      return;
    }
    this.carregarMeusLivros();
  }

  get livrosElegiveis(): Livro[] {
    return this.meusLivros.filter(
      (livro) => livro.disponivel && livro.modalidades?.includes('TROCA'),
    );
  }

  submeter(): void {
    if (!this.formulario.valid || !this.livroDestino) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando = true;
    const livroOferecidoId = this.formulario.value.livro_oferecido_id;
    this.apiService
      .criarTransacao({
        tipo: 'TROCA',
        livro_principal: this.livroDestino.id,
        livros_oferecidos_ids: [Number(livroOferecidoId)],
      })
      .pipe(finalize(() => (this.enviando = false)))
      .subscribe({
        next: async () => {
          await this.exibirToast('Proposta enviada!');
          this.navController.navigateBack('/transacoes');
        },
        error: async (erro) => {
          const mensagem = erro?.error?.detail ?? erro?.error ?? 'Não foi possível enviar.';
          await this.exibirToast(mensagem);
        },
      });
  }

  private async resgatarLivroDestino(): Promise<void> {
    const livroEstado = this.router.getCurrentNavigation()?.extras.state?.['livro'] as Livro | undefined;
    if (livroEstado) {
      this.livroDestino = livroEstado;
      return;
    }
    await this.exibirToast('Selecione um livro na busca para propor a troca.');
    this.navController.back();
  }

  private carregarMeusLivros(): void {
    this.carregandoLivros = true;
    this.apiService
      .obter<Livro[]>('livros/')
      .pipe(finalize(() => (this.carregandoLivros = false)))
      .subscribe({
        next: (dados) => {
          this.meusLivros = dados;
        },
        error: async () => {
          await this.exibirToast('Não foi possível carregar seus livros.');
          this.navController.back();
        },
      });
  }

  private async exibirToast(
    mensagem: string,
    cor: 'success' | 'danger' = 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: cor,
    });
    await toast.present();
  }
}

