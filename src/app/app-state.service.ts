import { Injectable } from '@angular/core';
import _ from 'lodash';
import { interval, Observable, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, map, share, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

const KeySwftUUID = 'key-swft-uuid';
const KeyAppLogInMethod = 'key-app-log-in-method';

export enum LoginMethod {
  MetaMask = 'metamask',
  NotLogIn = 'not_login',
}

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  loginMethodSubject$ = new Subject<LoginMethod>();

  subs$: Subscription[] = [];

  constructor() {
    const subLoginMethod = interval(500)
      .pipe(map(() => this.getLoginMethod()))
      .subscribe(
        (v) => {
          this.loginMethodSubject$.next(v);
        },
        (e) => {
          console.error('failed to update login method');
        }
      );

    this.subs$.push(subLoginMethod);
  }

  public getDeviceId(): string {
    const id = localStorage.getItem(KeySwftUUID);
    if (id === null) {
      const newId = uuidv4();
      localStorage.setItem(KeySwftUUID, newId);
      return newId;
    }
    return id;
  }

  public getLoginMethod(): LoginMethod {
    const method = localStorage.getItem(KeyAppLogInMethod);
    if (_.isEmpty(method)) {
      return LoginMethod.NotLogIn;
    }
    return method as LoginMethod;
  }

  public setLoginMethod(m: LoginMethod): void {
    localStorage.setItem(KeyAppLogInMethod, m);
    this.loginMethodSubject$.next(m);
  }

  public logout() {
    this.setLoginMethod(LoginMethod.NotLogIn);
  }

  public getLoginMethodOb(): Observable<LoginMethod> {
    return this.loginMethodSubject$
      .asObservable()
      .pipe(distinctUntilChanged(), share());
  }
}
