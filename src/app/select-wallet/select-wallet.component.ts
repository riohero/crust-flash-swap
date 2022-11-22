import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { WalletService } from '../wallet.service';
import { WalletItem, WALLETS } from '../wallets/wallet';

@Component({
  selector: 'app-select-wallet',
  templateUrl: './select-wallet.component.html',
  styleUrls: ['./select-wallet.component.scss'],
})
export class SelectWalletComponent implements OnInit, OnDestroy {
  wallets: WalletItem[] = WALLETS;
  sub?: Subscription
  constructor(
    private wallet: WalletService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
   
  }

  onClickWallet(item: WalletItem) {
    this.wallet.connectWallet(item.lm);
    if(this.sub) this.sub.unsubscribe()
    this.sub = this.wallet.accounts$.subscribe((accounts) => {
      if(accounts.length === 0){
        this.activeModal.dismiss()
      }
    })
  }

  ngOnDestroy(): void {}
}
