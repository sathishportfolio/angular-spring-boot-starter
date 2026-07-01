import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  private readonly API_URL = 'http://localhost:8080/api/users';

  createUser(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}`, data);
  }
  
  updateUser(id: any, data: any): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, data);
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.API_URL}`);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
