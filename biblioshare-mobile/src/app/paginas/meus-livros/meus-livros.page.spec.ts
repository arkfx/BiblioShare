import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MeusLivrosPage } from './meus-livros.page';

describe('MeusLivrosPage', () => {
  let component: MeusLivrosPage;
  let fixture: ComponentFixture<MeusLivrosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MeusLivrosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
