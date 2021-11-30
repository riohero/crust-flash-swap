import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, Subject, Subscription, timer } from 'rxjs';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  mergeMap,
  switchMap,
  tap,
} from 'rxjs/operators';
import { ERC20__factory } from 'src/typechain/factories/ERC20__factory';
import { AppStateService } from '../app-state.service';
import { KeyringService } from '../keyring.service';
import { SwftService } from '../swft.service';
import { WalletService } from '../wallet.service';

const defaultAssets: CryptoAsset[] = [
  {
    symbol: 'ETH',
    // chainId: 1,
    network: 'ETH',
    decimal: 18,
  },
];

const CRU: CryptoAsset = {
  symbol: 'USDT(ERC20)',
  network: 'ETH',
  // chainId: 0,
  contract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  decimal: 6,
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
export class FlashSwapComponent implements OnInit, OnDestroy {
  markets = TradeMarkets;

  selectedAsset: CryptoAsset = defaultAssets[0];
  cru = CRU;
  account: string | null = null;
  allCoinList: CoinInfo[] = [];
  fromCoinList: CryptoAsset[] = defaultAssets;

  coinListLoadStatus: CoinListStatus = 'loading';

  fromAmount = new FormControl('');
  toAddress = new FormControl('');
  toAmount = 0;
  selectAssetSubject$ = new Subject<CryptoAsset>();
  fromAmountSubject$ = new Subject<number | null>();
  errors: { [k: string]: boolean } = {};

  priceInfo?: NormalizedPriceInfo;
  loadPriceError = false;

  subs$: Subscription[] = [];
  subSwap$: Subscription = new Subscription();
  swapInProgress: boolean = false;

  constructor(
    private wallet: WalletService,
    private swft: SwftService,
    private keyring: KeyringService,
    private appState: AppStateService,
    private toast: ToastrService
  ) {}

  ngOnInit(): void {
    const subAccount$ = this.wallet.getAccountObs().subscribe(
      (accts) => {
        this.account = _.isEmpty(accts) ? null : accts[0];
      },
      (e) => {
        console.error('error getting account', e);
      }
    );
    this.subs$.push(subAccount$);

    const subFromAmount$ = this.fromAmount.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(50))
      .subscribe((v) => {
        if (v > 0) {
          this.errors = _.omit(this.errors, 'fromAmount');
        }
        console.log('v ', v);
        this.fromAmountSubject$.next(v);
      });
    this.subs$.push(subFromAmount$);

    const subCoinList$ = this.swft.getCoinList().subscribe(
      (result) => {
        if (result.resCode !== '800') {
          this.coinListLoadStatus = 'error';
          return;
        }
        this.coinListLoadStatus = 'loaded';
        this.allCoinList = result.data;
        this.fromCoinList = _.chain(this.allCoinList)
          .filter((c) => {
            const currentCoinCode = this.cru.symbol;
            const unsupported =
              _.findIndex(c.noSupportCoin.split(','), currentCoinCode) >= 0;
            return !unsupported;
          })
          .map((v) => {
            if (v.mainNetwork !== 'ETH') {
              return null;
            }
            return {
              symbol: v.coinCode,
              network: v.mainNetwork,
              contract: v.contact || '',
              decimal: v.coinDecimal,
            };
          })
          .filter()
          .sortBy((v) => v?.symbol)
          .value() as CryptoAsset[];
        const eth = _.find(this.fromCoinList, (c) => c.symbol === 'ETH');
        this.selectItem(eth ? eth : this.fromCoinList[0]);
      },
      () => {
        this.coinListLoadStatus = 'error';
      }
    );

    this.subs$.push(subCoinList$);

    const subAddr$ = this.toAddress.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(50))
      .subscribe(
        (v) => {
          if (this.isToAddressValid(v)) {
            this.errors = _.omit(this.errors, 'toAddress');
          }
        },
        (e) => {
          console.error('failed handle value changes', e);
        }
      );
    this.subs$.push(subAddr$);

    const subAsset$ = this.selectAssetSubject$
      .asObservable()
      .pipe(
        combineLatest(this.fromAmountSubject$.asObservable()),
        distinctUntilChanged(),
        debounceTime(50)
      )
      .pipe(combineLatest(timer(0, 10 * 1000))) // 每10秒更新一次报价
      .pipe(
        tap(() => (this.loadPriceError = false)),
        switchMap(([[assetSelected, fromAmount]]) => {
          return this.swft
            .getPriceInfo(assetSelected, this.cru)
            .pipe(
              map(
                (v) =>
                  [v, fromAmount] as [SwftResponse<PriceInfo>, number | null]
              )
            );
        })
      )
      .subscribe(
        ([result, fromAmount]) => {
          if (result.resCode !== '800') {
            this.loadPriceError = true;
            return;
          }
          this.loadPriceError = false;
          this.priceInfo = this.swft.normalziePriceInfo(result.data);
          this.toAmount = this.swft.getReturnAmount(
            fromAmount || 0,
            this.priceInfo!
          );
          // console.log('asset, amount, to', this.priceInfo, this.toAmount);
        },
        (e) => {
          console.error('error handling price update', e);
        }
      );

    this.subs$.push(subAsset$);

    const subSelectedAsset$ = this.selectAssetSubject$
      .asObservable()
      .pipe(
        map((v) => v.symbol),
        distinctUntilChanged()
      )
      .subscribe(
        () => {
          this.priceInfo = undefined;
        },
        () => {}
      );
    this.subs$.push(subSelectedAsset$);

    this.selectAssetSubject$.next(this.selectedAsset);
    this.fromAmountSubject$.next(0);
  }

  ngOnDestroy(): void {
    this.subs$.forEach((v) => v.unsubscribe());
    this.subs$ = [];
    this.subSwap$.unsubscribe();
  }

  public selectItem(item: CryptoAsset): void {
    this.selectedAsset = item;
    this.selectAssetSubject$.next(item);
    // this.itemSelected.emit(item);
  }

  public isConnected(): boolean {
    return this.account !== null && this.account.length > 0;
  }

  public getConnectedAddress(): string | null {
    return this.account;
  }

  public getShortAddress(): string | null {
    const addr = this.getConnectedAddress();
    if (!addr) {
      return null;
    }

    return addr.substring(0, 5) + '...' + addr.substring(addr.length - 5);
  }

  public connectWallet(): void {
    this.wallet.connectWallet().subscribe(
      () => {},
      (e) => {
        console.log('error connecting to wallet');
      }
    );
  }

  public getImageUrl(a: CryptoAsset): string {
    return `https://www.swftc.info/swft-v3/images/coins/${a.symbol}.png`;
  }

  public isValidAmount(amount: number): boolean {
    if (!this.priceInfo) {
      return false;
    }
    const min = Number(this.priceInfo.depositMin);
    const max = Number(this.priceInfo.depositMax);
    return amount >= min && amount <= max;
  }

  public doSwap(): void {
    if (this.swapInProgress) {
      return;
    }
    this.errors = {};
    if (!this.fromAmount.value || this.fromAmount.value <= 0) {
      this.errors['fromAmount'] = true;
    } else if (!this.isValidAmount(this.fromAmount.value)) {
      if (this.priceInfo) {
        this.toast.error(
          `Amount out of range, accepted amount range: ${
            this.priceInfo.depositMin
          } - ${this.priceInfo.depositMax} ${this.simplified(
            this.selectedAsset.symbol
          )}`,
          'Invalid amount'
        );
      }
      return;
    }
    if (!this.toAddress.value || !this.isToAddressValid(this.toAddress.value)) {
      this.errors['toAddress'] = true;
      this.toast.warning(
        'Please enter a valid receiving address',
        'Receiving Address Required'
      );
    }
    if (!this.priceInfo) {
      this.errors['price'] = true;
    }
    if (!_.isEmpty(this.errors) || !this.priceInfo || !this.account) {
      return;
    }

    const deviceId = this.appState.getDeviceId();
    console.debug('using device id: ', deviceId);
    const receiveCoinAmt = this.fromAmount.value * this.priceInfo!.instantRate;
    this.swapInProgress = true;
    this.subSwap$ = this.swft
      .createOrder({
        depositCoinAmt: `${this.fromAmount.value}`,
        depositCoinCode: this.selectedAsset.symbol,
        receiveCoinCode: this.cru.symbol,
        receiveCoinAmt: `${receiveCoinAmt}`,
        destinationAddr: this.toAddress.value,
        refundAddr: this.account!,
        equipmentNo: deviceId,
        sourceType: 'H5',
        sourceFlag: 'Crust',
      })
      .pipe(
        mergeMap((v) => {
          if (v.resCode !== '800') {
            return from([
              {
                success: false,
                reason: 'failed',
              },
            ]);
          }
          const orderResult = v.data;
          if (this.selectedAsset.symbol !== orderResult.depositCoinCode) {
            return from([
              {
                success: false,
                reason: 'ui-changed',
              },
            ]);
          }
          return from(
            this.wallet.composeSend(
              this.selectedAsset,
              orderResult.platformAddr,
              Number(orderResult.depositCoinAmt)
            )
          );
        })
      )
      .pipe(finalize(() => (this.swapInProgress = false)))
      .subscribe(
        (r) => {
          console.log('result: ', r);
        },
        (e: any) => {
          if (e.code === -32000) {
            this.toast.error(
              'Failed to send transaction, please check your input and the balance'
            );
          } else if (e.code === 4001) {
            this.toast.info('Transaction Cancelled');
          }
          console.error('error creating order', e);
        }
      );
  }

  private isToAddressValid(addr: string): boolean {
    return this.keyring.isAddressValid(addr);
  }

  public simplified(s: string): string {
    return s.replace(/\(.*\)/g, '');
  }

  public getSwapButtonText() {
    if (this.swapInProgress) {
      return 'Swapping...';
    }
    return 'Swap';
  }
}
