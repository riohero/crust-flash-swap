import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import _ from 'lodash';
import { Subscription } from 'rxjs';
import { AppStateService, LoginMethod } from '../app-state.service';
import { OrderHistoryComponent } from '../order-history/order-history.component';
import { WalletService } from '../wallet.service';
import { WALLETS } from '../wallets/wallet';

@Component({
  selector: 'app-account-status',
  templateUrl: './account-status.component.html',
  styleUrls: ['./account-status.component.scss'],
})
export class AccountStatusComponent implements OnInit, OnDestroy {
  account: string | null = null;
  subs$: Subscription[] = [];
  showTooltip = false;

  constructor(
    private appState: AppStateService,
    private wallet: WalletService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    
    const subAccount$ = this.wallet.getAccountObs().subscribe(
      (accts) => {
        this.account = _.isEmpty(accts) ? null : accts[0];
      },
      (e) => {
        console.error('error getting account', e);
      }
    );
    this.subs$.push(subAccount$);
  }

  ngOnDestroy(): void {
    for (const s of this.subs$) {
      s.unsubscribe();
    }
    this.subs$ = [];
  }

  public getConnectedAddress(): string | null {
    return this.account;
  }

  public getShortAddress(): string | null {
    const addr = this.getConnectedAddress();
    if (!addr) {
      return null;
    }

    return addr.substring(0, 5) + '...' + addr.substring(addr.length - 5);
  }

  public showOrderHistory() {
    const modalRef = this.modalService.open(OrderHistoryComponent, {
      size: 'lg',
    });
  }

  public logout() {
    this.appState.logout();
  }

  public getWalletSrc(){
    const type = this.wallet.wallet?.type || LoginMethod.NotLogIn
    const w = WALLETS.find(item => item.lm === type)
    return w?.img || ''
  }
}
