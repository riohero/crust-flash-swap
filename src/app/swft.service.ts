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
  public getCoinList(): Observable<SwftResponse<CoinInfo[]>> {
    return this.http.post<SwftResponse<CoinInfo[]>>(
      this.apiUrl('api/v1/queryCoinList'),
      {
        supportType: 'advanced',
      }
    );
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
    return this.http.post<SwftResponse<PriceInfo>>(
      this.apiUrl('api/v1/getBaseInfo'),
      {
        depositCoinCode: from.symbol,
        receiveCoinCode: to.symbol,
      }
    );
  }

  public getReturnAmount(fromAmount: number, price: PriceInfo): number {
    const depositFeeRate = Number(price.depositCoinFeeRate);
    const instantRate = Number(price.instantRate);
    const receiveCoinFee = Number(price.receiveCoinFee);
    const received =
      fromAmount * (1 - depositFeeRate) * instantRate - receiveCoinFee;
    if (received < 0) {
      return 0;
    }
    return _.floor(received, 6);
  }
}
