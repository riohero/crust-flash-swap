import { Component, Inject } from '@angular/core';
import { WalletService } from './wallet.service';

const defaultAssets: CryptoAsset[] = [
  {
    symbol: 'ETH',
    imageUrl: '/assets/ETH.png',
    chainId: 1,
    network: 'ethereum',
  },
  {
    symbol: 'USDT',
    imageUrl: '/assets/USDT.png',
    chainId: 1,
    network: 'ethereum',
  },
  {
    symbol: 'USDC',
    imageUrl: '/assets/USDC.png',
    chainId: 1,
    network: 'ethereum',
  },
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'crust-flash-swap';
  assets = defaultAssets;
  selectedAsset = defaultAssets[0];
  constructor(private walletService: WalletService) {}

  public setSelectedAsset(asset: CryptoAsset): void {
    this.selectedAsset = asset;
  }
}
