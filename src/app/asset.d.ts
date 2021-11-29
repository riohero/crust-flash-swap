type SupportedNetwork = 'ETH' | 'crust';

interface CryptoAsset {
  symbol: string;
  network: SupportedNetwork;
  // chainId: number;
  contract?: string;
  decimal: number;
}

interface Market {
  name: string;
  url: string;
  imageUrl: string;
}
