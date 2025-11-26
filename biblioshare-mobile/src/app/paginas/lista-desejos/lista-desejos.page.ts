import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { ListaDesejoItem } from '../../core/modelos/livros';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-lista-desejos',
  templateUrl: './lista-desejos.page.html',
  styleUrls: ['./lista-desejos.page.scss'],
})
export class ListaDesejosPage {
  itens: ListaDesejoItem[] = [];
  formulario: FormGroup;
  carregando = false;
  salvando = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly apiService: ApiService,
    private readonly toastController: ToastController,
  ) {
    this.formulario = this.formBuilder.group({
      titulo: [''],
      autor: [''],
      isbn: [''],
    });
  }

  ionViewWillEnter(): void {
    this.carregarItens();
  }

  carregarItens(event?: CustomEvent): void {
    this.carregando = true;
    this.apiService
      .obter<ListaDesejoItem[]>('lista-desejos/')
      .pipe(
        finalize(() => {
          this.carregando = false;
          event?.detail?.complete?.();
        }),
      )
      .subscribe({
        next: (dados) => (this.itens = dados),
        error: async () => {
          await this.exibirToast('Não foi possível carregar sua lista.', 'danger');
        },
      });
  }

  adicionar(): void {
    const valores = this.formulario.value;
    if (!valores.titulo && !valores.autor && !valores.isbn) {
      this.exibirToast('Informe título, autor ou ISBN para adicionar.', 'warning');
      return;
    }

    this.salvando = true;
    this.apiService
      .criar<ListaDesejoItem>('lista-desejos/', valores)
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: async (item) => {
          this.itens = [item, ...this.itens];
          this.formulario.reset();
          await this.exibirToast('Item adicionado.', 'success');
        },
        error: async () => {
          await this.exibirToast('Não foi possível adicionar o item.', 'danger');
        },
      });
  }

  remover(item: ListaDesejoItem): void {
    this.apiService.remover<void>(`lista-desejos/${item.id}/`).subscribe({
      next: async () => {
        this.itens = this.itens.filter((i) => i.id !== item.id);
        await this.exibirToast('Item removido.', 'success');
      },
      error: async () => {
        await this.exibirToast('Não foi possível remover o item.', 'danger');
      },
    });
  }

  private async exibirToast(
    mensagem: string,
    cor: 'success' | 'danger' | 'warning',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: cor,
    });
    await toast.present();
  }
}

