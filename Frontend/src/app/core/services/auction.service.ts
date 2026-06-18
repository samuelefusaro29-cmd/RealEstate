import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuctionDto {
  id: number;
  postId: number;
  startingPrice: number;
  currentBest: number;
  endDate: string;
  closed: boolean;
  currentWinnerId: number | null;
  winnerId: number | null;
}

export interface AuctionCreateRequest {
  postId: number;
  startingPrice: number;
  durationDays: number;
}

export interface BidDto {
  id: number;
  auctionId: number;
  userId: number;
  buyerName: string;
  amount: number;
  placedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuctionService {
  private http = inject(HttpClient);
  private base = 'http://localhost:8080/api/auctions';

  create(req: AuctionCreateRequest): Observable<AuctionDto> {
    return this.http.post<AuctionDto>(this.base, req);
  }

  getByPostId(postId: number): Observable<AuctionDto> {
    return this.http.get<AuctionDto>(`${this.base}/post/${postId}`);
  }

  placeBid(auctionId: number, amount: number): Observable<BidDto> {
    return this.http.post<BidDto>(`${this.base}/${auctionId}/bids`, { amount });
  }

  getBids(auctionId: number): Observable<BidDto[]> {
    return this.http.get<BidDto[]>(`${this.base}/${auctionId}/bids`);
  }

  delete(auctionId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${auctionId}`);
  }
}