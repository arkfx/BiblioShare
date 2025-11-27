import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalhesTransacaoPage } from './detalhes-transacao.page';

describe('DetalhesTransacaoPage', () => {
  let component: DetalhesTransacaoPage;
  let fixture: ComponentFixture<DetalhesTransacaoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalhesTransacaoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

