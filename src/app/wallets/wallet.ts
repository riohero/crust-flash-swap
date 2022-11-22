import { LoginMethod } from './../app-state.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Wallet {
  type: LoginMethod;
  chainId$: BehaviorSubject<number>;
  accounts$: BehaviorSubject<string[]>;
  init: () => Promise<Wallet>;
  connect: () => Promise<void>;
  destory: () => void;
  composeSend: (
    fromAsset: CryptoAsset,
    toAddress: string,
    amount: number
  ) => Observable<any>;

  balance: (account: string, coin: CryptoAsset) => Promise<number>;
}

export interface WalletItem {
  text: string;
  img: string;
  lm: LoginMethod;
}

export const WALLETS: WalletItem[] = [
  { text: 'MetaMask', img: '/assets/metamask.svg', lm: LoginMethod.MetaMask },
  { text: 'OKX Wallet', img: '/assets/okx.jpg', lm: LoginMethod.Okx },
];
