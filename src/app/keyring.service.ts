import { Injectable } from '@angular/core';
import { Keyring } from '@polkadot/keyring';

@Injectable({
  providedIn: 'root',
})
export class KeyringService {
  private keyring = new Keyring();

  constructor() {}

  public isAddressValid(addr: string): boolean {
    try {
      const a = this.keyring.decodeAddress(addr);
      return !!a;
    } catch (e) {
      return false;
    }
  }
}
