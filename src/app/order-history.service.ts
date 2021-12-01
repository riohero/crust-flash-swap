import { Injectable } from '@angular/core';
import _ from 'lodash';

const KeyOrderIds = 'swft-order-ids';
const MaxHistoryCount = 10;

@Injectable({
  providedIn: 'root',
})
export class OrderHistoryService {
  constructor() {}

  public getHistoryOrders(): LocalOrderInfo[] {
    const orders = localStorage.getItem(KeyOrderIds);
    if (!orders) {
      return [];
    }
    const result = JSON.parse(orders);
    if (_.isArray(result)) {
      return result;
    }
    return [];
  }

  public addOrder(order: LocalOrderInfo): void {
    const historyOrders = this.getHistoryOrders();
    const newOrders = _.take([order, ...historyOrders], MaxHistoryCount);
    localStorage.setItem(KeyOrderIds, JSON.stringify(newOrders));
  }
}
