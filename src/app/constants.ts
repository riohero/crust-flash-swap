
import * as _ from 'lodash';

export interface NetworkInfo {
  chainId: number;
  network: Network;
  nativeCoin: string;
  mostUsedCoins: string[];
  defaultAsset: CryptoAsset;
}

export const SupportedNetworks: NetworkInfo[] = [
  {
    chainId: 1,
    network: 'ETH',
    nativeCoin: 'ETH',
    mostUsedCoins: ['USDT(ERC20)', 'USDC', 'BUSD', 'DAI'],
    defaultAsset: {
      symbol: 'ETH',
      network: 'ETH',
      decimal: 18,
      isNative: true
    }
  },
  {
    chainId: 56,
    network: 'BSC',
    nativeCoin: 'BNB(BSC)',
    mostUsedCoins: ['USDT(BSC)', 'USDC(BSC)', 'BUSD(BSC)', 'DAI(BSC)'],
    defaultAsset: {
      symbol: 'BNB(BSC)',
      network: 'BSC',
      decimal: 18,
      isNative: true
    }
  },
];

export const SupportedNetworkMap = _.keyBy(SupportedNetworks, (v) => v.chainId);

export const CRU: CryptoAsset = {
  symbol: 'CRU',
  network: 'ETH',
  // chainId: 0,
  contract: '',
  decimal: 12,
  isNative: false
};
