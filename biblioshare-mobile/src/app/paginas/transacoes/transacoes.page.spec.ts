import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransacoesPage } from './transacoes.page';

describe('TransacoesPage', () => {
  let component: TransacoesPage;
  let fixture: ComponentFixture<TransacoesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TransacoesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
