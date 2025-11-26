import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AutenticacaoService } from '../services/autenticacao.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly autenticacaoService: AutenticacaoService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let requisicao = request;

    if (this.autenticacaoService.deveAnexarToken(request.url)) {
      const token = this.autenticacaoService.obterTokenDeAcesso();
      if (token) {
        requisicao = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    }

    return next.handle(requisicao).pipe(
      catchError((erro: HttpErrorResponse) => {
        if (erro.status === 401 && this.autenticacaoService.deveAnexarToken(request.url)) {
          return this.autenticacaoService.atualizarToken().pipe(
            switchMap((novoToken) => {
              const requisicaoComToken = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${novoToken}`,
                },
              });
              return next.handle(requisicaoComToken);
            }),
            catchError((refreshErro) => {
              this.autenticacaoService.limparSessao();
              return throwError(() => refreshErro);
            }),
          );
        }

        if (erro.status === 401) {
          this.autenticacaoService.limparSessao();
        }

        return throwError(() => erro);
      }),
    );
  }
}

