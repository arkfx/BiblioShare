import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

import { AutenticacaoService } from '../services/autenticacao.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly autenticacaoService: AutenticacaoService,
    private readonly router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.autenticacaoService.estaAutenticado()) {
      return true;
    }
    return this.router.createUrlTree(['/entrar']);
  }
}

