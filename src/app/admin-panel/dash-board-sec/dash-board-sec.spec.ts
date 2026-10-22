import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashBoardSec } from './dash-board-sec';

describe('DashBoardSec', () => {
  let component: DashBoardSec;
  let fixture: ComponentFixture<DashBoardSec>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashBoardSec],
    }).compileComponents();

    fixture = TestBed.createComponent(DashBoardSec);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
