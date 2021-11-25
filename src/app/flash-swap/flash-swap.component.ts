import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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
export class FlashSwapComponent {
  @Input() assets: CryptoAsset[] = [];
  @Input() selectedAsset: CryptoAsset | null = null;
  @Output() itemSelected = new EventEmitter<CryptoAsset>();
  cru = CRU;

  markets = TradeMarkets;

  constructor() {}

  public selectItem(item: CryptoAsset): void {
    this.itemSelected.emit(item);
  }
}
