import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AlertController,
  IonicModule,
  NavController,
  ToastController,
} from '@ionic/angular';
import type { HTMLIonAlertElement, HTMLIonToastElement } from '@ionic/angular';
import { of } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { DetalhesLivroPage } from './detalhes-livro.page';

class ApiServiceMock {
  obter() {
    return of({
      id: 1,
      dono: 1,
      isbn: '',
      titulo: 'Livro teste',
      autor: '',
      editora: '',
      ano_publicacao: '',
      capa_url: '',
      sinopse: '',
      modalidades: [],
      valor_aluguel_semanal: null,
      prazo_emprestimo_dias: null,
      disponivel: true,
      criado_em: '',
      atualizado_em: '',
    });
  }
  atualizar() {
    return of({});
  }
  remover() {
    return of({});
  }
}

class NavControllerMock {
  back() {}
  navigateBack() {}
}

class ToastControllerMock {
  create() {
    return Promise.resolve({
      present: () => Promise.resolve(),
    } as HTMLIonToastElement);
  }
}

class AlertControllerMock {
  create() {
    return Promise.resolve({
      present: () => Promise.resolve(),
    } as HTMLIonAlertElement);
  }
}

class ActivatedRouteMock {
  snapshot = {
    paramMap: {
      get: () => '1',
    },
  };
}

describe('DetalhesLivroPage', () => {
  let component: DetalhesLivroPage;
  let fixture: ComponentFixture<DetalhesLivroPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetalhesLivroPage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [
        { provide: ApiService, useClass: ApiServiceMock },
        { provide: NavController, useClass: NavControllerMock },
        { provide: ToastController, useClass: ToastControllerMock },
        { provide: AlertController, useClass: AlertControllerMock },
        { provide: ActivatedRoute, useValue: new ActivatedRouteMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalhesLivroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

