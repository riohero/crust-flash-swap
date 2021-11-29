interface SwftResponse<T> {
  data: T;
  resCode: string;
  resMsg: string;
  resMsgEn: string;
}

type Network = 'ETH' | 'BSC';

interface CoinInfo {
  coinId: string;
  coinName: string;
  contract: string;
  coinCode: string;
  coinDecimal: number;
  coinAllCode: string;
  coinImageUrl: string; // empty
  isSupportAdvanced: 'Y' | 'N';
  mainNetwork: string;
  noSupportCoin: string;
}

type CoinListStatus = 'loading' | 'error' | 'loaded';

interface PriceInfo {
  depositMax: string;
  depositMin: string;
  depositCoinFeeRate: string;
  instantRate: string;
  minerFee: string;
  receiveCoinFee: string;
}

interface NormalizedPriceInfo {
  depositMax: number;
  depositMin: number;
  depositCoinFeeRate: number;
  instantRate: number;
  minerFee: number;
  receiveCoinFee: number;
}
