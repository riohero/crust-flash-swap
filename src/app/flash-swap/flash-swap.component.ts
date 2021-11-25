import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';
import { ERC20__factory } from 'src/typechain/factories/ERC20__factory';
import { WalletService } from '../wallet.service';

const CRU: CryptoAsset = {
  symbol: 'CRU',
  network: 'crust',
  chainId: 0,
  imageUrl: '/assets/CRU.png',
};

const TradeMarkets: Market[] = [
  {
    name: 'Houbi',
    imageUrl: '/assets/ht.svg',
    url: 'https://www.huobi.com',
  },
  {
    name: 'Uniswap',
    imageUrl: '/assets/uniswap.svg',
    url: 'https://app.uniswap.com',
  },
  {
    name: 'Gateio',
    imageUrl: '/assets/gateio.svg',
    url: 'https://www.gate.io',
  },
  {
    name: 'ZB.COM',
    imageUrl: '/assets/zbg.svg',
    url: 'https://zb.com',
  },
  {
    name: 'Coinone',
    imageUrl: '/assets/coinone.svg',
    url: 'https://coinone.co.kr',
  },
  {
    name: 'Hotbit',
    imageUrl: '/assets/hotbit.svg',
    url: 'https://hotbit.io',
  },
  {
    name: 'BitMart',
    imageUrl: '/assets/bitmart.svg',
    url: 'https://bitmart.com',
  },
];

@Component({
  selector: 'app-flash-swap',
  templateUrl: './flash-swap.component.html',
  styleUrls: ['./flash-swap.component.scss'],
})
export class FlashSwapComponent implements OnInit {
  @Input() assets: CryptoAsset[] = [];
  @Input() selectedAsset: CryptoAsset | null = null;
  @Output() itemSelected = new EventEmitter<CryptoAsset>();
  cru = CRU;
  account: string | null = null;
  markets = TradeMarkets;

  constructor(private wallet: WalletService) {}

  ngOnInit(): void {
    this.wallet.getAccountObs().subscribe(
      (accts) => {
        this.account = _.isEmpty(accts) ? null : accts[0];
      },
      (e) => {
        console.error('error getting account', e);
      }
    );
  }

  public selectItem(item: CryptoAsset): void {
    this.itemSelected.emit(item);
  }

  public isConnected(): boolean {
    return this.account !== null && this.account.length > 0;
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

  public connectWallet(): void {
    this.wallet.connectWallet().subscribe(
      () => {},
      (e) => {
        console.log('error connecting to wallet');
      }
    );
  }
}
