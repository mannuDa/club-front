import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterAdmin } from './footer-admin';

describe('FooterAdmin', () => {
  let component: FooterAdmin;
  let fixture: ComponentFixture<FooterAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
