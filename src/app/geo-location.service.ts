import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const ApiKey = '1ad0fa33fc6a4cb1ad8097eda2baf295';

interface GeoLocaitonResponse {
  ip: string;
  country_code3: string;
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
}
