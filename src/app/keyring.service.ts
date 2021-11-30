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
      if (addr.length !== 49) {
        return false;
      }
      const a = this.keyring.decodeAddress(addr, false, 66);
      return !!a;
    } catch (e) {
      return false;
    }
  }
}
