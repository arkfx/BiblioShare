import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { Livro } from '../../core/modelos/livros';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-meus-livros',
  templateUrl: './meus-livros.page.html',
  styleUrls: ['./meus-livros.page.scss'],
})
export class MeusLivrosPage {
  livros: Livro[] = [];
  carregando = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
    private readonly toastController: ToastController,
  ) {}

  ionViewWillEnter(): void {
    this.carregarLivros();
  }

  carregarLivros(event?: CustomEvent): void {
    this.carregando = true;
    this.apiService
      .obter<Livro[]>('livros/')
      .pipe(
        finalize(() => {
          this.carregando = false;
          event?.detail?.complete?.();
        }),
      )
      .subscribe({
        next: (dados) => {
          this.livros = dados;
        },
        error: async () => {
          await this.exibirToast('Não foi possível carregar seus livros.');
        },
      });
  }

  abrirAdicionar(): void {
    this.router.navigate(['/adicionar-livro']);
  }

  abrirDetalhes(livro: Livro): void {
    this.router.navigate(['/livros', livro.id]);
  }

  trackByLivro(_: number, livro: Livro): number {
    return livro.id;
  }

  private async exibirToast(mensagem: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: 'danger',
    });
    await toast.present();
  }
}
