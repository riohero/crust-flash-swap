import { SelectWalletComponent } from './select-wallet/select-wallet.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  NgbDropdownModule,
  NgbModalModule,
  NgbModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FlashSwapComponent } from './flash-swap/flash-swap.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { ServiceUnavailableComponent } from './service-unavailable/service-unavailable.component';
import { HeaderComponent } from './header/header.component';
import { AccountStatusComponent } from './account-status/account-status.component';
import { SelectTokenComponent } from './select-token/select-token.component';

@NgModule({
  declarations: [
    AppComponent,
    FlashSwapComponent,
    OrderHistoryComponent,
    PageNotFoundComponent,
    ServiceUnavailableComponent,
    HeaderComponent,
    AccountStatusComponent,
    SelectTokenComponent,
    SelectWalletComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgbTooltipModule,
    NgbModalModule,
    NgbDropdownModule,
    HttpClientModule,
    ReactiveFormsModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-center',
      preventDuplicates: true,
      timeOut: 5000,
      iconClasses: {
        warning: 'alert-warn',
        info: 'alert-info',
        error: 'alert-error',
      },
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
