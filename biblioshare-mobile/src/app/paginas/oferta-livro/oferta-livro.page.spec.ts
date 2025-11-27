import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertaLivroPage } from './oferta-livro.page';

describe('OfertaLivroPage', () => {
  let component: OfertaLivroPage;
  let fixture: ComponentFixture<OfertaLivroPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertaLivroPage],
    }).compileComponents();

    fixture = TestBed.createComponent(OfertaLivroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

