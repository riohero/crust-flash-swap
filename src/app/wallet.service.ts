import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import * as _ from 'lodash';
import { from, interval, Observable } from 'rxjs';
import { filter, finalize, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  accounts$: Observable<string[]>;
  provider: ethers.providers.Web3Provider;
  pendingCommands = false;

  constructor() {
    // eslint-disable-next-line
    this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
    this.accounts$ = interval(500).pipe(
      filter(() => !this.pendingCommands), // skip update when there're pending commands
      switchMap(() => from(this.provider.listAccounts().catch((e) => [])))
    );
  }

  public getAccountObs(): Observable<string[]> {
    return this.accounts$;
  }

  private commuteWithEthers<T>(f: () => Promise<T>) {
    this.pendingCommands = true;
    return from(f()).pipe(finalize(() => (this.pendingCommands = false)));
  }

  public connectWallet(): Observable<void> {
    return this.commuteWithEthers(() =>
      this.provider.send('eth_requestAccounts', [])
    );
  }
}
