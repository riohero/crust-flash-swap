import { HttpClient } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import * as _ from 'lodash';
import { filter } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from './../environments/environment';

const SwftBase = environment.swftApiUrl;

@Injectable({
  providedIn: 'root',
})
export class SwftService {
  constructor(private http: HttpClient) {}

  private apiUrl(api: string): string {
    return `${SwftBase}/${api}`;
  }

  private request<T>(api: string, body: object): Observable<SwftResponse<T>> {
    return this.http.post<SwftResponse<T>>(this.apiUrl(api), body);
  }

  public getCoinList(): Observable<SwftResponse<CoinInfo[]>> {
    return this.request<CoinInfo[]>('api/v1/queryCoinList', {
      supportType: 'advanced',
    });
  }

  public getSupportedTokens(
    allCoins: CoinInfo[],
    toToken: CoinInfo
  ): CoinInfo[] {
    return allCoins;
  }

  public getPriceInfo(
    from: CryptoAsset,
    to: CryptoAsset
  ): Observable<SwftResponse<PriceInfo>> {
    return this.request<PriceInfo>('api/v1/getBaseInfo', {
      depositCoinCode: from.symbol,
      receiveCoinCode: to.symbol,
    });
  }

  public normalziePriceInfo(price: PriceInfo): NormalizedPriceInfo {
    const depositFeeRate = Number(price.depositCoinFeeRate);
    const instantRate = Number(price.instantRate);
    const receiveCoinFee = Number(price.receiveCoinFee);
    return {
      depositMax: Number(price.depositMax),
      depositMin: Number(price.depositMin),
      depositCoinFeeRate: depositFeeRate,
      instantRate,
      receiveCoinFee,
      minerFee: Number(price.minerFee),
    };
  }

  public getReturnAmount(
    fromAmount: number,
    price: NormalizedPriceInfo
  ): number {
    const depositFeeRate = price.depositCoinFeeRate;
    const instantRate = price.instantRate;
    const receiveCoinFee = price.receiveCoinFee;
    const received =
      fromAmount * (1 - depositFeeRate) * instantRate - receiveCoinFee;
    if (received < 0) {
      return 0;
    }
    return _.floor(received, 6);
  }

  public createOrder(
    payload: CreateOrderPayload
  ): Observable<SwftResponse<CreateOrderResult>> {
    return this.request<CreateOrderResult>('api/v2/accountExchange', payload);
  }

  public getOrderStatus(
    deviceId: string,
    orderId: string
  ): Observable<SwftResponse<OrderResult>> {
    return this.request<OrderResult>('api/v2/queryOrderState', {
      equipmentNo: deviceId,
      orderId,
      sourceType: 'H5',
    });
  }
}
