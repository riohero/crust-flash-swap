import { Wallet } from './wallet';
import { LoginMethod } from './../app-state.service';
import { includes } from 'lodash';
import { EthereumWallet } from './ethereum';
export function createWallet(lm: LoginMethod): Wallet | undefined {
  if (includes([LoginMethod.MetaMask, LoginMethod.Okx], lm))
    return new EthereumWallet(lm);
  return undefined;
}
