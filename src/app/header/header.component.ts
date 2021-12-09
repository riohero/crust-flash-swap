import { Component, OnDestroy, OnInit } from '@angular/core';
import _ from 'lodash';
import { Subscription } from 'rxjs';
import { WalletService } from '../wallet.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  account: string | null = null;
  subs$: Subscription[] = [];

  constructor(private wallet: WalletService) {}

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

  public isConnected(): boolean {
    return this.account !== null && this.account.length > 0;
  }
}
