import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LowerCloths } from './products';

describe('LowerCloths', () => {
  let component: LowerCloths;
  let fixture: ComponentFixture<LowerCloths>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LowerCloths],
    }).compileComponents();

    fixture = TestBed.createComponent(LowerCloths);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
