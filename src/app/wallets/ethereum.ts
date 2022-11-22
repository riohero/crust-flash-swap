import { ERC20__factory } from 'src/typechain/factories/ERC20__factory';
import { BehaviorSubject, from } from 'rxjs';
import { LoginMethod } from '../app-state.service';
import { Wallet } from './wallet';
import { ethers } from 'ethers';
import { BigNumber } from 'bignumber.js';
import _ from 'lodash';

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const keymap = {
  [LoginMethod.MetaMask]: 'ethereum',
  [LoginMethod.Okx]: 'okxwallet',
  [LoginMethod.NotLogIn]: '',
};

export class EthereumWallet implements Wallet {
  type: LoginMethod;
  chainId$: BehaviorSubject<number>;
  accounts$: BehaviorSubject<string[]>;
  window_key: string;
  provider?: ethers.providers.Web3Provider;

  _onAccountChange?: (accounts: string[]) => void;
  _onChainChange?: (_chainId: string) => void;
  _inited: boolean = false;

  constructor(lm: LoginMethod) {
    this.type = lm;
    this.window_key = keymap[lm] || 'ethereum';
    this.chainId$ = new BehaviorSubject(1);
    this.accounts$ = new BehaviorSubject<string[]>([]);
  }

  _createWeb3Provider() {
    return new ethers.providers.Web3Provider((window as any)[this.window_key]);
  }

  async init() {
    let injectObj = (window as any)[this.window_key];
    if (!injectObj) {
      await sleep(1000);
      injectObj = (window as any)[this.window_key];
    }
    if (!injectObj) throw `not inject obj on window.${this.window_key}`;

    this.provider = this._createWeb3Provider();
    if (this._inited) return this;
    this._inited = true;
    this._onAccountChange = (accounts: string[]) => {
      this.accounts$.next(accounts);
    };
    this._onChainChange = (_chainId: string) => {
      this.chainId$.next(_.toNumber(_chainId));
      this.provider = this._createWeb3Provider();
    };
    try {
      await this.provider.listAccounts().then(this._onAccountChange);
      const net = await this.provider.getNetwork();
      this._onChainChange('' + net.chainId);
    } catch (error) {}
    injectObj.on('accountsChanged', this._onAccountChange);
    injectObj.on('chainChanged', this._onChainChange);
    return this;
  }

  async connect() {
    if (!this.provider) return;
    return this.provider
      .send('eth_requestAccounts', [])
      .then(this._onAccountChange)
      .then(() => this.provider?.getNetwork())
      .then((net) => {
        if (net && this._onChainChange) {
          this._onChainChange('' + net.chainId);
        }
      });
  }

  async balance(account: string, coin: CryptoAsset) {
    if (!this.provider) return 0;
    if (coin.isNative) {
      const bl = await this.provider.getBalance(account);
      return _.toNumber(ethers.utils.formatUnits(bl, coin.decimal));
    } else if (coin.contract) {
      const erc20 = ERC20__factory.connect(
        coin.contract,
        this.provider.getSigner()
      );
      const bl = await erc20.balanceOf(account);
      return _.toNumber(ethers.utils.formatUnits(bl, coin.decimal));
    }
    return 0;
  }

  composeSend(fromAsset: CryptoAsset, toAddress: string, amount: number) {
    if (!this.provider) return from([]);
    const isNativeToken = _.isEmpty(fromAsset.contract);
    const fromAmountStr = new BigNumber(amount)
      .multipliedBy(new BigNumber(10).pow(fromAsset.decimal))
      .toFixed();
    const fromAmount = ethers.BigNumber.from(fromAmountStr);
    if (isNativeToken) {
      return from(
        this.provider.getSigner().sendTransaction({
          to: toAddress,
          value: fromAmount,
        })
      );
    }
    const contract = ERC20__factory.connect(
      fromAsset.contract!,
      this.provider.getSigner()
    );
    return from(contract.transfer(toAddress, fromAmount));
  }
  destory() {
    let injectObj = (window as any)[this.window_key];
    if (this._onAccountChange && injectObj)
      injectObj.removeListener('accountsChanged', this._onAccountChange);
    if (this._onChainChange && injectObj)
      injectObj.removeListener('chainChanged', this._onChainChange);
    this.accounts$.unsubscribe();
    this.chainId$.unsubscribe();
  }
}
