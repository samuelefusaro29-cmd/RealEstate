import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { User, Role } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private adminBase = `${environment.apiUrl}/admin`;

  list(): Observable<User[]> {
    return forkJoin({
      buyers:  this.http.get<any[]>(`${this.adminBase}/users`),
      sellers: this.http.get<any[]>(`${this.adminBase}/sellers`),
      admins:  this.http.get<any[]>(`${this.adminBase}/admins`),
    }).pipe(
        map(({ buyers, sellers, admins }) => [
          ...buyers.map(u  => ({ ...u, role: 'BUYER'  as Role })),
          ...sellers.map(s => ({ ...s, role: 'SELLER' as Role })),
          ...admins.map(a  => ({ ...a, role: 'ADMIN'  as Role, banned: false })),
        ])
    );
  }

  ban(email: string): Observable<string> {
    return this.http.post(`${this.adminBase}/ban`, { email }, { responseType: 'text' });
  }

  unban(email: string): Observable<string> {
    return this.http.post(`${this.adminBase}/unban`, { email }, { responseType: 'text' });
  }

  // usa endpoint diverso in base al ruolo
  delete(id: number, role: Role): Observable<string> {
    const endpoint = role === 'SELLER'
        ? `${this.adminBase}/sellers/${id}`
        : `${this.adminBase}/users/${id}`;
    return this.http.delete(endpoint, { responseType: 'text' });
  }

  getBlacklist(): Observable<string[]> {
    return this.http.get<string[]>(`${this.adminBase}/blacklist`);
  }

  promote(email: string): Observable<string> {
    return this.http.post(`${this.adminBase}/promote`, { email }, { responseType: 'text' });
  }
}