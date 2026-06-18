import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    RentalRequestDto,
    RentalRequestResponse,
    RentalContractResponse,
} from '../models/rental.model';

@Injectable({ providedIn: 'root' })
export class RentalService {
    private http = inject(HttpClient);
    private base = `${environment.apiUrl}/rentals`;

    createRequest(dto: RentalRequestDto): Observable<RentalRequestResponse> {
        return this.http.post<RentalRequestResponse>(`${this.base}/request`, dto);
    }

    getBuyerRequests(): Observable<RentalRequestResponse[]> {
        return this.http.get<RentalRequestResponse[]>(`${this.base}/requests/buyer`);
    }

    getSellerRequests(): Observable<RentalRequestResponse[]> {
        return this.http.get<RentalRequestResponse[]>(`${this.base}/requests/seller`);
    }

    acceptRequest(id: number): Observable<RentalContractResponse> {
        return this.http.put<RentalContractResponse>(`${this.base}/requests/${id}/accept`, {});
    }

    rejectRequest(id: number): Observable<void> {
        return this.http.put<void>(`${this.base}/requests/${id}/reject`, {});
    }

    getTenantContracts(): Observable<RentalContractResponse[]> {
        return this.http.get<RentalContractResponse[]>(`${this.base}/contracts/tenant`);
    }

    getLandlordContracts(): Observable<RentalContractResponse[]> {
        return this.http.get<RentalContractResponse[]>(`${this.base}/contracts/landlord`);
    }

    terminateContract(id: number): Observable<void> {
        return this.http.put<void>(`${this.base}/contracts/${id}/terminate`, {});
    }

    getBookedPeriods(postId: number): Observable<{ start: string; end: string }[]> {
        return this.http.get<{ start: string; end: string }[]>(
            `${this.base}/booked-periods/${postId}`
        );
    }
}