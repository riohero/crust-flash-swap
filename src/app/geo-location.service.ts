import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const ApiKey = 'c97f18074f05404a9cdd1b47e549907b';

interface GeoLocaitonResponse {
  ip: string;
  country_code3: string;
}

interface IpLookupResponse {
  ipResult: {
    country: {
      iso_code: string;
    } | null;
  } | null;
}

@Injectable({
  providedIn: 'root',
})
export class GeoLocationService {
  constructor(private http: HttpClient) {}

  public getClientGeoInfo(): Observable<GeoLocaitonResponse> {
    return this.http.get<GeoLocaitonResponse>(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${ApiKey}`
    );
  }

  public getClientCountryCode(): Observable<IpLookupResponse> {
    return this.http.get<IpLookupResponse>(
      'https://crust-c9108.web.app/api/my-ip'
    );
  }
}
