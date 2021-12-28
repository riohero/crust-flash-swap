type SupportedNetwork = 'ETH' | 'BSC';

interface CryptoAsset {
  symbol: string;
  network: SupportedNetwork;
  // chainId: number;
  contract?: string;
  decimal: number;
  isNative: boolean;
}

interface Market {
  name: string;
  url: string;
  imageUrl: string;
}
