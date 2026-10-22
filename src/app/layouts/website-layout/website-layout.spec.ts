import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebsiteLayout } from './website-layout';

describe('WebsiteLayout', () => {
  let component: WebsiteLayout;
  let fixture: ComponentFixture<WebsiteLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebsiteLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(WebsiteLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
