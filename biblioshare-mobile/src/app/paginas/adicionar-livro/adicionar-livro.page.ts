import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';

import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

import { Livro, LivroPayload } from '../../core/modelos/livros';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  selector: 'app-adicionar-livro',
  templateUrl: './adicionar-livro.page.html',
  styleUrls: ['./adicionar-livro.page.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class AdicionarLivroPage {
  formulario: FormGroup;
  salvando = false;
  buscandoIsbn = false;
  readonly modalidades = [
    { valor: 'DOACAO', texto: 'Doação' },
    { valor: 'EMPRESTIMO', texto: 'Empréstimo' },
    { valor: 'ALUGUEL', texto: 'Aluguel' },
    { valor: 'TROCA', texto: 'Troca' },
  ];

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly apiService: ApiService,
    private readonly navController: NavController,
    private readonly toastController: ToastController,
  ) {
    this.formulario = this.formBuilder.group({
      isbn: [''],
      titulo: ['', Validators.required],
      autor: [''],
      editora: [''],
      ano_publicacao: [''],
      capa_url: [''],
      sinopse: [''],
      modalidades: [[], Validators.required],
      valor_aluguel_semanal: [null],
      prazo_emprestimo_dias: [null],
      disponivel: [true],
    });
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.salvando = true;
    const payload = this.montarPayload();
    this.apiService
      .criar<Livro>('livros/', payload)
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: async () => {
          await this.exibirToast('Livro cadastrado com sucesso!', 'success');
          this.navController.back();
        },
        error: async (erro) => {
          const mensagem = erro?.error?.detalhe ?? 'Não foi possível salvar o livro.';
          await this.exibirToast(mensagem, 'danger');
        },
      });
  }

  buscarPorIsbn(): void {
    const isbn = (this.formulario.get('isbn')?.value ?? '').trim();
    if (!isbn) {
      this.exibirToast('Informe um ISBN para buscar.', 'warning');
      return;
    }
    this.chamarBuscaIsbn(isbn);
  }

  async escanearIsbn(): Promise<void> {
    try {
      const possuiPermissao = await this.verificarPermissaoCamera();
      if (!possuiPermissao) {
        await this.exibirToast('Permissão da câmera negada.', 'danger');
        return;
      }
      const resultado = await BarcodeScanner.scan();
      const codigo = resultado.barcodes[0]?.rawValue;
      if (!codigo) {
        await this.exibirToast('Nenhum código detectado.', 'warning');
        return;
      }
      this.formulario.patchValue({ isbn: codigo });
      this.chamarBuscaIsbn(codigo);
    } catch {
      await this.exibirToast('Não foi possível acessar a câmera.', 'danger');
    }
  }

  private chamarBuscaIsbn(isbn: string): void {
    this.buscandoIsbn = true;
    this.apiService
      .criar<Partial<Livro>>('livros/buscar-isbn/', { isbn })
      .pipe(finalize(() => (this.buscandoIsbn = false)))
      .subscribe({
        next: (dados) => this.preencherCampos(dados),
        error: async () => {
          await this.exibirToast('Livro não encontrado ou erro na busca.', 'warning');
        },
      });
  }

  private montarPayload(): LivroPayload {
    const valores = this.formulario.value;
    return {
      isbn: valores.isbn ?? '',
      titulo: valores.titulo,
      autor: valores.autor ?? '',
      editora: valores.editora ?? '',
      ano_publicacao: valores.ano_publicacao ?? '',
      capa_url: valores.capa_url ?? '',
      sinopse: valores.sinopse ?? '',
      modalidades: valores.modalidades ?? [],
      valor_aluguel_semanal: valores.valor_aluguel_semanal
        ? Number(valores.valor_aluguel_semanal)
        : null,
      prazo_emprestimo_dias: valores.prazo_emprestimo_dias
        ? Number(valores.prazo_emprestimo_dias)
        : null,
      disponivel: valores.disponivel ?? true,
    };
  }

  private preencherCampos(dados: Partial<Livro>): void {
    this.formulario.patchValue({
      titulo: dados.titulo ?? this.formulario.get('titulo')?.value,
      autor: dados.autor ?? this.formulario.get('autor')?.value,
      editora: dados.editora ?? this.formulario.get('editora')?.value,
      ano_publicacao: dados.ano_publicacao ?? this.formulario.get('ano_publicacao')?.value,
      capa_url: dados.capa_url ?? this.formulario.get('capa_url')?.value,
      sinopse: dados.sinopse ?? this.formulario.get('sinopse')?.value,
    });
  }

  private async verificarPermissaoCamera(): Promise<boolean> {
    const status = await BarcodeScanner.checkPermissions();
    if (status.camera === 'granted' || status.camera === 'limited') {
      return true;
    }
    const solicitacao = await BarcodeScanner.requestPermissions();
    return solicitacao.camera === 'granted' || solicitacao.camera === 'limited';
  }

  private async exibirToast(
    mensagem: string,
    cor: 'success' | 'danger' | 'warning' = 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: cor,
    });
    await toast.present();
  }
}

