import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminPerson {
    id: number;
    name: string;
    surname: string;
    email: string;
}

export interface AdminUser extends AdminPerson {
    birthDate?: string | null;
    banned: boolean;
    authProvider?: string | null;
    role: 'BUYER';
}

export interface AdminSeller extends AdminPerson {
    vatNumber?: string | null;
    birthDate?: string | null;
    banned: boolean;
    role: 'SELLER';
}

export interface AdminAccount extends AdminPerson {
    role: 'ADMIN';
}

export interface AdminDashboardData {
    users: AdminUser[];
    sellers: AdminSeller[];
    admins: AdminAccount[];
    blacklist: string[];
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    private base = `${environment.apiUrl}/admin`;

    getDashboardData(): Observable<AdminDashboardData> {
        return forkJoin({
            users: this.http.get<any[]>(`${this.base}/users`),
            sellers: this.http.get<any[]>(`${this.base}/sellers`),
            admins: this.http.get<any[]>(`${this.base}/admins`),
            blacklist: this.http.get<string[]>(`${this.base}/blacklist`)
        }).pipe(
            map(({ users, sellers, admins, blacklist }) => ({
                users: users.map(u => ({
                    ...u,
                    role: 'BUYER' as const
                })),
                sellers: sellers.map(s => ({
                    ...s,
                    role: 'SELLER' as const
                })),
                admins: admins.map(a => ({
                    ...a,
                    role: 'ADMIN' as const
                })),
                blacklist
            }))
        );
    }

    ban(email: string): Observable<string> {
        return this.http.post(`${this.base}/ban`, { email }, { responseType: 'text' });
    }

    unban(email: string): Observable<string> {
        return this.http.post(`${this.base}/unban`, { email }, { responseType: 'text' });
    }

    promote(email: string): Observable<string> {
        return this.http.post(`${this.base}/promote`, { email }, { responseType: 'text' });
    }

    deleteUser(id: number): Observable<string> {
        return this.http.delete(`${this.base}/users/${id}`, { responseType: 'text' });
    }

    deleteSeller(id: number): Observable<string> {
        return this.http.delete(`${this.base}/sellers/${id}`, { responseType: 'text' });
    }
}