import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { from, Subject, Subscription, timer, zip } from 'rxjs';
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
import { environment } from 'src/environments/environment';
import { SupportedNetworkMap, CRU, TradeMarkets } from '../constants';
import { AppStateService } from '../app-state.service';
import { GeoLocationService } from '../geo-location.service';
import { KeyringService } from '../keyring.service';
import { OrderHistoryService } from '../order-history.service';
import { OrderHistoryComponent } from '../order-history/order-history.component';
import { SelectTokenComponent } from '../select-token/select-token.component';
import { SwftService } from '../swft.service';
import { WalletService } from '../wallet.service';
import { SelectWalletComponent } from '../select-wallet/select-wallet.component';

const defaultChainId = 1;

@Component({
  selector: 'app-flash-swap',
  templateUrl: './flash-swap.component.html',
  styleUrls: ['./flash-swap.component.scss'],
})
export class FlashSwapComponent implements OnInit, OnDestroy {
  markets = TradeMarkets;
  selectedAsset: CryptoAsset = _.get(SupportedNetworkMap, defaultChainId)
    .defaultAsset;
  cru = CRU;
  account: string | null = null;
  chainId = defaultChainId;

  fromAmount = new FormControl('');
  toAddress = new FormControl('');
  toAmount = 0;
  selectAssetSubject$ = new Subject<CryptoAsset>();
  fromAmountSubject$ = new Subject<number | null>();
  errors: { [k: string]: boolean } = {};

  priceInfo?: NormalizedPriceInfo;
  reversePriceInfo?: NormalizedPriceInfo;
  showReversePrice = false;
  loadPriceError = false;

  subs$: Subscription[] = [];
  subSwap$: Subscription = new Subscription();
  swapInProgress: boolean = false;

  constructor(
    private wallet: WalletService,
    private swft: SwftService,
    private keyring: KeyringService,
    private appState: AppStateService,
    private toast: ToastrService,
    private orderHistoryService: OrderHistoryService,
    private modalService: NgbModal,
    private geoLocation: GeoLocationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (environment.checkIp) {
      this.geoLocation.getClientCountryCode().subscribe(
        (result) => {
          const code = result.ipResult?.country?.iso_code;
          if (
            code === 'CN' ||
            code === 'CHN' ||
            code === 'US' ||
            code === 'USA'
          ) {
            this.router.navigate(['/unavailable']);
          }
        },
        (e) => {
          console.log('failed fetch geo location', e);
          this.router.navigate(['/unavailable']);
        }
      );
    }
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
        this.fromAmountSubject$.next(v);
      });
    this.subs$.push(subFromAmount$);

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
          return zip(
            this.swft.getPriceInfo(assetSelected, this.cru),
            this.swft.getPriceInfo(this.cru, assetSelected)
          ).pipe(
            map(
              ([v1, v2]) =>
                [v1, v2, fromAmount] as [
                  SwftResponse<PriceInfo>,
                  SwftResponse<PriceInfo>,
                  number | null
                ]
            )
          );
        })
      )
      .subscribe(
        ([result1, result2, fromAmount]) => {
          if (result1.resCode !== '800' || result2.resCode !== '800') {
            this.loadPriceError = true;
            return;
          }
          this.loadPriceError = false;
          this.priceInfo = this.swft.normalziePriceInfo(result1.data);
          this.reversePriceInfo = this.swft.normalziePriceInfo(result2.data);
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
          this.reversePriceInfo = undefined;
          this.showReversePrice = false;
        },
        () => {}
      );
    this.subs$.push(subSelectedAsset$);

    const subChainId = this.wallet.getChainIdObs().subscribe(
      (id) => {
        this.chainId = id;
        const network = _.get(SupportedNetworkMap, this.chainId);
        if (network) {
          this.selectItem(network.defaultAsset);
        }
      },
      (e) => {
        console.log('error updating chain id', e);
      }
    );
    this.subs$.push(subChainId);

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
    this.fromAmount.setValue('');
    this.toAmount = 0;
  }

  public isConnected(): boolean {
    return this.account !== null && this.account.length > 0;
  }

  public togglePriceDirection() {
    this.showReversePrice = !this.showReversePrice;
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
    this.modalService.open(SelectWalletComponent, {
      size: 'mid',
      centered: true,
    });
    // this.wallet.connectWallet().subscribe(
    //   () => {},
    //   (e) => {
    //     console.log('error connecting to wallet');
    //   }
    // );
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

  public async doSwap(): Promise<void> {
    if (this.swapInProgress) {
      return;
    }
    this.errors = {};
    if (!this.fromAmount.value || this.fromAmount.value <= 0) {
      this.errors['fromAmount'] = true;
      this.toast.error('Please enter a valid amount');
      return;
    } else if (!this.isValidAmount(this.fromAmount.value)) {
      if (this.priceInfo) {
        this.toast.error(
          `Amount out of range, accepted amount range: ${
            this.priceInfo.depositMin
          } - ${this.priceInfo.depositMax} ${this.simplified(
            this.selectedAsset.symbol
          )}`
        );
      }
      return;
    }
    if (!this.toAddress.value || !this.isToAddressValid(this.toAddress.value)) {
      this.errors['toAddress'] = true;
      this.toast.warning('Please enter a valid receiving address');
    }
    if (!this.priceInfo) {
      this.errors['price'] = true;
    }
    if (!_.isEmpty(this.errors) || !this.priceInfo || !this.account) {
      return;
    }

    const balance = await this.wallet.getCoinBalance(
      this.account!,
      this.selectedAsset
    );
    if (this.fromAmount.value > balance) {
      this.toast.error('Insufficient Balance');
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
                code: v.resCode,
              },
            ]);
          }
          const orderResult = v.data;
          if (this.selectedAsset.symbol !== orderResult.depositCoinCode) {
            return from([
              {
                success: false,
                reason: 'ui-changed',
                code: '0',
              },
            ]);
          }
          return from(
            this.wallet.composeSend(
              this.selectedAsset,
              orderResult.platformAddr,
              Number(orderResult.depositCoinAmt)
            )
          ).pipe(
            map((v) => {
              return {
                success: true,
                code: '0',
                order: orderResult,
              };
            })
          );
        })
      )
      .pipe(finalize(() => (this.swapInProgress = false)))
      .subscribe(
        (r) => {
          console.log('result: ', r);
          if (r && !r.success) {
            if (r.code) {
              this.toast.error(
                `Failed to create an order, the error code is: ${r.code}`
              );
            }
            return;
          }
          this.toast.info('Transaction sent, please wait for settlement.');
          if ('order' in r) {
            this.orderHistoryService.addOrder({
              orderId: r.order.orderId,
              fromToken: r.order.depositCoinCode,
              toToken: r.order.receiveCoinCode,
              amount: Number(r.order.depositCoinAmt),
            });
          }
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

  public showOrderHistory() {
    this.modalService.open(OrderHistoryComponent, {
      size: 'lg',
    });
  }

  public showSelectTokenModal() {
    this.modalService
      .open(SelectTokenComponent, {
        size: 'md',
      })
      .result.then(
        (result) => {
          this.selectItem(result);
        },
        (reason) => {
          console.log(`Dismissed ${reason}`);
        }
      );
  }

  public isNetworkSupported(): boolean {
    return _.has(SupportedNetworkMap, this.chainId);
  }
}
