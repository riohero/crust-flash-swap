import { Component } from '@angular/core';
import { TradeMarkets } from '../constants';

@Component({
  selector: 'app-service-unavailable',
  templateUrl: './service-unavailable.component.html',
  styleUrls: ['./service-unavailable.component.scss'],
})
export class ServiceUnavailableComponent {
  markets = TradeMarkets;
  constructor() {}
}
