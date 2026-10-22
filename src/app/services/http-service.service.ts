import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HttpServiceService {

  readonly imageBaseURL = 'http://localhost:8000';
  readonly apiURL = this.imageBaseURL + '/api/';

  constructor(private http: HttpClient, private ngZone: NgZone, private router: Router) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
  getUserRole(): string {
    const token = localStorage.getItem('authToken');
    if (!token) return localStorage.getItem('Role') || '';

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const tokenRole = payload.role || payload.roles;
      if (tokenRole) { return tokenRole; }
      return localStorage.getItem('Role') || '';
    } catch (e) {
      console.error('JWT Decode Error:', e);
      return localStorage.getItem('Role') || '';
    }
  }

private handleAuthError() {
    return catchError((error: HttpErrorResponse) => {
      // Agar status 401 ho, ya 500 ho aur message mein authentication/jwt ka zikr ho
      const errMessage = error.error?.message || error.message || '';
      
      if (error.status === 401 || error.status === 500 && (errMessage.includes('authenticate') || errMessage.includes('jwt') || errMessage.includes('token'))) {
        console.warn('Authentication failed or token expired. Flushing tokens...');
        
        this.tokenFlush();

        this.ngZone.run(() => {
          this.router.navigate(['/login']); 
        });
      }
      return throwError(() => error);
    });
  }
  
  isAuthenticated(): boolean {
    const token = JSON.parse(sessionStorage.getItem('tokens') || '{}');
    return !!token?.access?.token;
  }
  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  tokenFlush() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('Role');
    sessionStorage.removeItem('tokens');
    localStorage.removeItem('user-profile');
    localStorage.removeItem('user-id');
  }

  post(url: string, body: any) {
    return this.http.post(this.apiURL + url, body, { headers: this.getHeaders() }).pipe(this.handleAuthError());
  }

  put(url: string, data: any) {
    return this.http.put<any>(this.apiURL + url, data, { headers: this.getHeaders() }).pipe(this.handleAuthError());
  }

  patch(url: string, data: any) {
    const type = Object.getPrototypeOf(data);
    let id: any;
    if (type.append) {
      const stringifyId = JSON.stringify(Object.fromEntries(data));
      const parseId = JSON.parse(stringifyId);
      id = parseId.id;
      data.delete("id");
    } else {
      id = data.id;
      delete data.id;
    }
    return this.http.patch<any>(this.apiURL + url + "/" + id, data, { headers: this.getHeaders() }).pipe(this.handleAuthError());
  }

  get(url: string) {
    return this.http.get<any>(this.apiURL + url, { headers: this.getHeaders() }).pipe(this.handleAuthError());
  }

  getById(url: string, id: string) {
    return this.http.get<any>(this.apiURL + url + "/" + id, { headers: this.getHeaders() }).pipe(this.handleAuthError());
  }

  delete(url: string, id: any) {
    return this.http.delete<any>(this.apiURL + url + "/" + id, { headers: this.getHeaders() }).pipe(this.handleAuthError());
  }


}