import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import type { HTMLIonToastElement } from '@ionic/angular';
import { of } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { ListaDesejosPage } from './lista-desejos.page';

class ApiServiceMock {
  obter() {
    return of([]);
  }
  criar() {
    return of({
      id: 1,
      titulo: 'Novo',
      autor: null,
      isbn: null,
      criado_em: new Date().toISOString(),
    });
  }
  remover() {
    return of({});
  }
}

class ToastControllerMock {
  create() {
    return Promise.resolve({
      present: () => Promise.resolve(),
    } as HTMLIonToastElement);
  }
}

describe('ListaDesejosPage', () => {
  let component: ListaDesejosPage;
  let fixture: ComponentFixture<ListaDesejosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListaDesejosPage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [
        { provide: ApiService, useClass: ApiServiceMock },
        { provide: ToastController, useClass: ToastControllerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaDesejosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

