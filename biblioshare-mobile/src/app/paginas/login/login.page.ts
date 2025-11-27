import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { AutenticacaoService } from '../../core/services/autenticacao.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class LoginPage {
  formulario: FormGroup;
  carregando = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly router: Router,
    private readonly toastController: ToastController,
  ) {
    this.formulario = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() {
    return this.formulario.get('email');
  }

  get senha() {
    return this.formulario.get('senha');
  }

  entrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando = true;
    const { email, senha } = this.formulario.value;
    this.autenticacaoService.entrar(email, senha).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigateByUrl('/meus-livros', { replaceUrl: true });
      },
      error: async (erro) => {
        this.carregando = false;
        await this.exibirErro(
          erro?.error?.detail ?? 'Não foi possível validar suas credenciais.',
        );
      },
    });
  }

  irParaRegistro(): void {
    this.router.navigate(['/registrar']);
  }

  private async exibirErro(mensagem: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      color: 'danger',
    });
    await toast.present();
  }
}
