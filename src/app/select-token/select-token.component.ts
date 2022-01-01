import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { Subscription, fromEvent } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { DefaultChainId, SupportedNetworkMap, CRU } from '../constants';
import { SwftService } from '../swft.service';
import { WalletService } from '../wallet.service';

interface CryptoAssetWithBalance extends CryptoAsset{
  balance: string
}

interface CryptoAssetWithIndex extends CryptoAssetWithBalance{
  index: number
}

@Component({
  selector: 'app-select-token',
  templateUrl: './select-token.component.html',
  styleUrls: ['./select-token.component.scss']
})
export class SelectTokenComponent implements OnInit, OnDestroy {
  @ViewChild('searchTokenInput') searchTokenInput?: ElementRef;

  subs$: Subscription[] = [];

  cru = CRU;

  coinListLoadStatus: CoinListStatus = 'loading';
  chainId = DefaultChainId;
  allCoinList: CoinInfo[] = [];
  mostUsedCoinList: CryptoAssetWithBalance[] = [];
  supportedCoinList: CryptoAssetWithBalance[] = [];

  searchInput = '';
  filteredCoinList: CryptoAssetWithBalance[] = [];

  constructor(
    private wallet: WalletService,
    private swft: SwftService,
    public activeModal: NgbActiveModal,
    private toast: ToastrService
  ) { }

  ngOnInit(): void {
    const subChainId = this.wallet.getChainIdObs().subscribe(
      (id) => {
        this.chainId = id;
        this.updateCoinList(this.allCoinList);
      },
      (e) => {
        console.log('error updating chain id', e);
      }
    );
    this.subs$.push(subChainId);

    const subCoinList$ = this.swft.getCoinList().subscribe(
      (result) => {
        if (result.resCode !== '800') {
          this.coinListLoadStatus = 'error';
          this.toast.error('Error loading coin list from SWFT. Please try again later.');
          return;
        }
        this.coinListLoadStatus = 'loaded';
        this.updateCoinList(result.data);
        // this.toast.info('Finish loading coin list');
      },
      () => {
        this.coinListLoadStatus = 'error';
        this.toast.error('Error loading coin list from SWFT. Please try again later.');
      }
    );
    this.subs$.push(subCoinList$);
  }

  ngAfterViewInit() {
    const subSearchInput = fromEvent(this.searchTokenInput?.nativeElement, 'keyup')
      .pipe(
        debounceTime(100),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        this.searchInput = this.searchTokenInput?.nativeElement.value;
        this.filterCoinList();
      });
    this.subs$.push(subSearchInput);
  }

  private updateCoinList(coinList: CoinInfo[]) {
    this.allCoinList = coinList;

    const mostUsedCoins: CryptoAssetWithIndex[] = [];

    // console.log('allCoinList', this.allCoinList);
    this.supportedCoinList = _.chain(this.allCoinList)
      .filter((c) => {
        const currentCoinCode = this.cru.symbol;
        const unsupported =
          _.findIndex(c.noSupportCoin.split(','), currentCoinCode) >= 0;
        return !unsupported;
      })
      .map((v) => {
        const network = _.get(SupportedNetworkMap, this.chainId);
        if (!network) {
          return null;
        }
        if (v.mainNetwork !== network.network) {
          return null;
        }
        const coin: CryptoAssetWithBalance = {
          symbol: v.coinCode,
          network: v.mainNetwork,
          contract: v.contact || '',
          decimal: v.coinDecimal,
          balance: '',
          isNative: v.coinCode === network.nativeCoin
        };
        const index = _.findIndex(network.mostUsedCoins, c => c === coin.symbol);
        if (index >= 0) {
          mostUsedCoins.push({
            index,
            ...coin
          });
        }
        return coin;
      })
      .filter()
      .value() as CryptoAssetWithBalance[];

    this.mostUsedCoinList = _.sortBy(mostUsedCoins, c => c.index);

    const accounts = this.wallet.getAccountObs().getValue();
    if (!_.isEmpty(accounts)) {
      Promise.all(_.map(this.supportedCoinList, async(coin) => {
        const balance = await this.wallet.getCoinBalance(accounts[0], coin);
        coin.balance = _.toString(balance);
      })).then(() => {
        this.supportedCoinList = this.supportedCoinList.sort((left, right) => {
          const leftBalance = _.toNumber(left.balance);
          const rightBalance = _.toNumber(right.balance);
          if (leftBalance == rightBalance) {
            return left.symbol < right.symbol ? -1 : 1;
          }
          return rightBalance - leftBalance;
        });
      });
    }
    // console.log('supportedCoinList', this.supportedCoinList);
    this.filterCoinList();
  }

  private filterCoinList() {
    const normalizedSearchInput = _.toUpper(_.trim(this.searchInput));
    if (_.isEmpty(normalizedSearchInput)) {
      this.filteredCoinList = this.supportedCoinList;
      return;
    }

    this.filteredCoinList = _.filter(this.supportedCoinList, (coin) => {
      return _.includes(_.toUpper(coin.symbol), normalizedSearchInput) ||
        (!_.isEmpty(coin.contract) && _.toUpper(coin.contract) === normalizedSearchInput);
    });
    console.log('filteredCoinList', this.filteredCoinList);
  }

  public getImageUrl(a: CryptoAsset): string {
    return `https://www.swftc.info/swft-v3/images/coins/${a.symbol}.png`;
  }

  public selectToken(token: CryptoAsset): void {
    this.activeModal.close(token);
  }

  ngOnDestroy(): void {
    this.subs$.forEach((v) => v.unsubscribe());
    this.subs$ = [];
  }

}
