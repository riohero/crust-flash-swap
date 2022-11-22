import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectWalletComponent } from './select-wallet.component';

describe('SelectTokenComponent', () => {
  let component: SelectWalletComponent;
  let fixture: ComponentFixture<SelectWalletComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectWalletComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
