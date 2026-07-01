import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenService } from '../../../core/services/token';

@Injectable({
  providedIn: 'root',
})

export class Auth {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  
  private readonly API_URL = 'http://localhost:8080/api/auth';

  login(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/login`, data);
  }

  signup(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/signup`, data);
  }

  // Explicit backend logout call
  logout(): Observable<any> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http.post(`${this.API_URL}/logout`, { refreshToken });
  }

  // Silent refresh background call
  refreshAccessToken(refreshToken: string): Observable<any> {
    return this.http.post(`${this.API_URL}/refresh`, { refreshToken });
  }
}
