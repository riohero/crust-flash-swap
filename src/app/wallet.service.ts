import { Injectable } from '@angular/core';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import * as _ from 'lodash';
import { from, interval, Observable } from 'rxjs';
import { filter, finalize, share, switchMap } from 'rxjs/operators';
import { ERC20__factory } from 'src/typechain/factories/ERC20__factory';

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
      switchMap(() => from(this.provider.listAccounts().catch((e) => []))),
      share()
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

  public composeSend(
    fromAsset: CryptoAsset,
    toAddress: string,
    amount: number
  ): Observable<any> {
    const isNativeToken = _.isEmpty(fromAsset.contract);
    const fromAmountStr = new BigNumber(amount)
      .multipliedBy(new BigNumber(10).pow(fromAsset.decimal))
      .toFixed();
    const fromAmount = ethers.BigNumber.from(fromAmountStr);
    if (isNativeToken) {
      return this.commuteWithEthers(() => {
        return this.provider.getSigner().sendTransaction({
          to: toAddress,
          value: fromAmount,
        });
      });
    }

    const contract = ERC20__factory.connect(
      fromAsset.contract!,
      this.provider.getSigner()
    );
    return from(contract.transfer(toAddress, fromAmount));
  }
}
