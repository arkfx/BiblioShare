import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { AutenticacaoService } from '../../core/services/autenticacao.service';

@Component({
  standalone: true,
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule],
})
export class RegistroPage {
  formulario: FormGroup;
  carregando = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly router: Router,
    private readonly toastController: ToastController,
  ) {
    this.formulario = this.formBuilder.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        senha: ['', [Validators.required, Validators.minLength(6)]],
        confirmarSenha: ['', [Validators.required]],
      },
      {
        validators: (group: FormGroup) => {
          const senha = group.get('senha')?.value;
          const confirmar = group.get('confirmarSenha')?.value;
          if (senha && confirmar && senha !== confirmar) {
            group.get('confirmarSenha')?.setErrors({ diferentes: true });
          } else {
            const errors = group.get('confirmarSenha')?.errors;
            if (errors) {
              delete errors['diferentes'];
              if (Object.keys(errors).length === 0) {
                group.get('confirmarSenha')?.setErrors(null);
              } else {
                group.get('confirmarSenha')?.setErrors(errors);
              }
            }
          }
          return null;
        },
      },
    );
  }

  get username() {
    return this.formulario.get('username');
  }

  get email() {
    return this.formulario.get('email');
  }

  get senha() {
    return this.formulario.get('senha');
  }

  get confirmarSenha() {
    return this.formulario.get('confirmarSenha');
  }

  registrar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.carregando = true;
    const { username, email, senha, confirmarSenha } = this.formulario.value;
    this.autenticacaoService
      .registrar({ username, email, senha, confirmarSenha })
      .subscribe({
        next: () => {
          this.carregando = false;
          this.router.navigateByUrl('/perfil', { replaceUrl: true });
        },
        error: async (erro) => {
          this.carregando = false;
          await this.exibirErro(
            erro?.error?.detail ?? 'Não foi possível completar o cadastro.',
          );
        },
      });
  }

  irParaLogin(): void {
    this.router.navigate(['/entrar']);
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

