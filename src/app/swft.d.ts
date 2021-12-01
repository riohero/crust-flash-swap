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
  contact: string;
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

type SourceType = 'Android' | 'IOS' | 'H5';
interface CreateOrderPayload {
  depositCoinCode: string;
  depositCoinAmt: string;
  receiveCoinCode: string;
  receiveCoinAmt: string;
  destinationAddr: string;
  refundAddr: string;
  equipmentNo: string;
  sourceType: SourceType;
  sourceFlag: 'Crust';
}

type OrderStatus =
  | 'wait_deposit_send'
  | 'timeout'
  | 'wait_exchange_push'
  | 'wait_exchange_return'
  | 'wait_receive_send'
  | 'receive_complete'
  | 'wait_refund_send'
  | 'error'
  | 'ERROR'
  | 'WAIT_KYC';

interface CreateOrderResult {
  orderId: string;
  createTime: string;
  dealFinishTime: string | null;
  depositCoinAmt: string;
  depositCoinCode: string;
  receiveCoinCode: string;
  platformAddr: string; // send asset to this address
  detailState: OrderStatus;
}

interface OrderResult extends CreateOrderResult {
  transactionId: string;
  refundDepositTxid: string;
  refundCoinAmt: string;
}

interface LocalOrderInfo {
  orderId: string;
  fromToken: string;
  toToken: string;
  amount: number;
}
