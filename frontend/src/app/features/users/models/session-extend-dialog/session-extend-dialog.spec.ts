import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionExtendDialog } from './session-extend-dialog';

describe('SessionExtendDialog', () => {
  let component: SessionExtendDialog;
  let fixture: ComponentFixture<SessionExtendDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionExtendDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionExtendDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
