import { Injectable, OnDestroy } from '@angular/core';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import * as _ from 'lodash';
import { from, interval, observable, Observable, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  finalize,
  share,
  switchMap,
} from 'rxjs/operators';
import { ERC20__factory } from 'src/typechain/factories/ERC20__factory';
import { AppStateService, LoginMethod } from './app-state.service';

@Injectable({
  providedIn: 'root',
})
export class WalletService implements OnDestroy {
  accounts$: Observable<string[]>;
  chainId$: Observable<number>;
  provider: ethers.providers.Web3Provider;
  pendingCommands = false;

  subs$: Subscription[] = [];

  constructor(private appState: AppStateService) {
    // eslint-disable-next-line
    this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
    const metaMaskAccounts = interval(500).pipe(
      filter(() => !this.pendingCommands), // skip update when there're pending commands
      switchMap(() => from(this.provider.listAccounts().catch((e) => [])))
    );

    const metamaskChainIds = interval(500).pipe(
      filter(() => !this.pendingCommands), // skip update when there're pending commands
      switchMap(() => {
        return from([_.parseInt((window as any).ethereum.networkVersion)]);
      })
    );

    this.accounts$ = appState.getLoginMethodOb().pipe(
      switchMap((v) => {
        if (v === LoginMethod.MetaMask) {
          return metaMaskAccounts;
        }
        // todo: support more wallets here

        return from([[]]);
      }),
      share()
    );

    this.chainId$ = appState.getLoginMethodOb().pipe(
      switchMap((v) => {
        if (v === LoginMethod.MetaMask) {
          return metamaskChainIds;
        }
        return from([0]);
      }),
      distinctUntilChanged(),
      share()
    );

    const updateProvider = this.chainId$.subscribe(
      (v) => {
        console.log('recreating provider');
        // eslint-disable-next-line
        this.provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );
      },
      (e) => {
        console.log('error updating provider', e);
      }
    );
    this.subs$.push(updateProvider);
  }
  ngOnDestroy(): void {
    for (const s of this.subs$) {
      s.unsubscribe();
    }
    this.subs$ = [];
  }

  public getAccountObs(): Observable<string[]> {
    return this.accounts$;
  }

  public getChainIdObs(): Observable<number> {
    return this.chainId$;
  }

  private commuteWithEthers<T>(f: () => Promise<T>) {
    this.pendingCommands = true;
    return from(f()).pipe(finalize(() => (this.pendingCommands = false)));
  }

  public connectWallet(): Observable<void> {
    return this.commuteWithEthers(() => {
      this.appState.setLoginMethod(LoginMethod.MetaMask);
      return this.provider.send('eth_requestAccounts', []);
    });
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
