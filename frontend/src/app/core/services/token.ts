import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN = 'access_token';
  private readonly REFRESH_TOKEN = 'refresh_token';

  saveTokens(username: string, accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN, refreshToken);
  }

  getUserName(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      // JWTs are split into three parts by dots: Header.Payload.Signature
      const payloadBase64 = token.split('.')[1];
      
      // Safely handle decoding UTF-8 characters via native base64 decoding
      const decodedPayload = atob(payloadBase64);
      const payloadData = JSON.parse(decodedPayload);

      // Return the subject ('sub') which holds your username string
      return payloadData.sub || null;
    } catch (error) {
      console.error('Error decoding JWT token payload:', error);
      return null;
    }
  }
  
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
  }
}