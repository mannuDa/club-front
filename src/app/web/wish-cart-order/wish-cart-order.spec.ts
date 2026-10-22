import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WishCartOrder } from './wish-cart-order';

describe('WishCartOrder', () => {
  let component: WishCartOrder;
  let fixture: ComponentFixture<WishCartOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WishCartOrder],
    }).compileComponents();

    fixture = TestBed.createComponent(WishCartOrder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
