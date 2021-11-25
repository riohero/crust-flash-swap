import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlashSwapComponent } from './flash-swap.component';

describe('FlashSwapComponent', () => {
  let component: FlashSwapComponent;
  let fixture: ComponentFixture<FlashSwapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlashSwapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlashSwapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
