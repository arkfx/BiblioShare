import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropostaTrocaPage } from './proposta-troca.page';

describe('PropostaTrocaPage', () => {
  let component: PropostaTrocaPage;
  let fixture: ComponentFixture<PropostaTrocaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PropostaTrocaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

