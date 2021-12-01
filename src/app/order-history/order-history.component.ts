import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import _ from 'lodash';
import { from, Observable, Subscription } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { AppStateService } from '../app-state.service';
import { OrderHistoryService } from '../order-history.service';
import { SwftService } from '../swft.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss'],
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  public orders: LocalOrderInfo[] = [];
  public orderDetails: { [key: string]: OrderResult } = {};

  private subOrders$ = new Subscription();

  constructor(
    public activeModal: NgbActiveModal,
    private swft: SwftService,
    private orderHistory: OrderHistoryService,
    private appState: AppStateService
  ) {}

  ngOnInit(): void {
    this.orders = this.orderHistory.getHistoryOrders();
    this.subOrders$ = from(this.orders)
      .pipe(
        mergeMap((v) =>
          this.swft.getOrderStatus(this.appState.getDeviceId(), v.orderId).pipe(
            catchError((e) => {
              return from([]);
            })
          )
        )
      )
      .subscribe(
        (v) => {
          this.orderDetails[v.data.orderId] = v.data;
        },
        (e) => {
          console.log('error fetching order details', e);
        }
      );
  }

  ngOnDestroy(): void {
    this.subOrders$.unsubscribe();
  }

  public getShortOrderId(orderId: string) {
    if (!orderId) {
      return '';
    }
    if (orderId.length < 15) {
      return orderId;
    }
    return (
      orderId.substring(0, 5) + '...' + orderId.substring(orderId.length - 5)
    );
  }

  public getOrderStatus(order: OrderResult): string {
    if (!_.isEmpty(order.transactionId)) {
      return 'Success';
    }
    switch (order.detailState) {
      case 'timeout':
        return 'Timeout';
      case 'wait_deposit_send':
        return 'Waiting Deposit';
      case 'wait_exchange_push':
      case 'wait_exchange_return':
        return 'Deposit Confirming';
      case 'receive_complete':
        return 'Deposit Confirmed';
      case 'wait_refund_send':
        return 'Refunding';
      case 'error':
      case 'ERROR':
        return 'Order Error';
      case 'receive_complete':
        return 'Success';
      case 'WAIT_KYC':
        return 'KYC Required';
    }
    return 'Waiting';
  }
}
