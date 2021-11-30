import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

const KeySwftUUID = 'key-swft-uuid';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  constructor() {}

  public getDeviceId(): string {
    const id = localStorage.getItem(KeySwftUUID);
    if (id === null) {
      const newId = uuidv4();
      localStorage.setItem(KeySwftUUID, newId);
      return newId;
    }
    return id;
  }
}
