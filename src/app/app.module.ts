import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbDropdown, NgbDropdownModule, NgbModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FlashSwapComponent } from './flash-swap/flash-swap.component';

@NgModule({
  declarations: [
    AppComponent,
    FlashSwapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    NgbDropdownModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
