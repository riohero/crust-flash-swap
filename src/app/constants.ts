
import * as _ from 'lodash';

export interface NetworkInfo {
  chainId: number;
  network: Network;
  nativeCoin: string;
  mostUsedCoins: string[];
  defaultAsset: CryptoAsset;
}

export const DefaultChainId = 1;

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

export const TradeMarkets: Market[] = [
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
    name: 'Cruswap',
    imageUrl: '/assets/Cruswap.svg',
    url: 'https://csm.crust.network/#/swap',
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
  {
    name: 'HyperPay',
    imageUrl: '/assets/hyperpay.png',
    url: 'https://www.hyperpay.tech',
  },
];
