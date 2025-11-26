import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import type { HTMLIonToastElement } from '@ionic/angular';
import { of } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { AdicionarLivroPage } from './adicionar-livro.page';

class ApiServiceMock {
  criar() {
    return of({});
  }
}

class NavControllerMock {
  back() {}
}

class ToastControllerMock {
  create() {
    return Promise.resolve({
      present: () => Promise.resolve(),
    } as HTMLIonToastElement);
  }
}

describe('AdicionarLivroPage', () => {
  let component: AdicionarLivroPage;
  let fixture: ComponentFixture<AdicionarLivroPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdicionarLivroPage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [
        { provide: ApiService, useClass: ApiServiceMock },
        { provide: NavController, useClass: NavControllerMock },
        { provide: ToastController, useClass: ToastControllerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdicionarLivroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

