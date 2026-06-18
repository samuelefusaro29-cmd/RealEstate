import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Post, PostCreateDto,
  Property, RealEstateDto, PropertyFilters, RealEstateRequest,
  REAL_ESTATE_TYPE_TO_CATEGORY, REAL_ESTATE_TYPE_LABELS,
} from '../models';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function toProperty(raw: any, re?: any, photos: string[] = []): Property {
  let city = '';
  let address = re?.address ?? '';

  if (re?.address) {
    const parts = re.address.split(',');
    if (parts.length >= 2) {
      const secondPart = parts[1].trim();
      const cityMatch = secondPart.match(/^\d+\s+(.+?)\s*\(.*\)$/);
      city = cityMatch ? cityMatch[1].trim() : secondPart;
    }
  }

  const rawPhotos: string[] = (raw.photoUrls ?? []).map((p: any) =>
      typeof p === 'string' ? p : p.url
  );

  const rawType: string = re?.type ?? 'APARTMENT';
  const category = REAL_ESTATE_TYPE_TO_CATEGORY[rawType] ?? 'APARTMENT';
  const categoryLabel = REAL_ESTATE_TYPE_LABELS[rawType] ?? rawType;

  return {
    id:                raw.id,
    code:              String(raw.id).padStart(5, '0'),
    title:             raw.title        ?? '',
    description:       raw.description  ?? '',
    category,
    categoryLabel,
    listingType:       raw.listingType  ?? 'SALE',
    price:             raw.currentPrice ?? 0,
    oldPrice:          raw.previousPrice > 0 ? raw.previousPrice : null,
    squareMeters:      re?.squareMetres  ?? 0,
    address:           address,
    city:              city,
    latitude:          re?.latit         ?? 0,
    longitude:         re?.longit        ?? 0,
    photos:            rawPhotos.length ? rawPhotos : photos,
    sellerId:          raw.sellerId      ?? 0,
    realEstateId:      raw.realEstateId  ?? null,
    sellerName:        raw.sellerName    ?? '',
    createdAt:         raw.createdAt     ?? '',
    numberOfRooms:     re?.numberOfRooms    ?? null,
    floor:             re?.floor            ?? null,
    hasElevator:       re?.hasElevator      ?? false,
    hasGarden:         re?.hasGarden        ?? false,
    hasPool:           re?.hasPool          ?? false,
    isElectric:        re?.isElectric       ?? false,
    cubature:          re?.cubature         ?? null,
    plannedUse:        re?.plannedUse       ?? null,
    cropType:          re?.cropType         ?? null,
    sold:              raw.sold             ?? false,
  };
}

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private http      = inject(HttpClient);
  private auth      = inject(AuthService);
  private base      = `${environment.apiUrl}/posts`;
  private adminBase = `${environment.apiUrl}/admin`;   // ✅ NUOVO
  private reBase    = `${environment.apiUrl}/realestate`;
  private photoBase = `${environment.apiUrl}/photos`;

  private enrichPost(post: any): Observable<Property> {
    return forkJoin([
      this.http.get<any>(`${this.reBase}/${post.realEstateId}`),
      this.http.get<any[]>(`${this.photoBase}/post/${post.id}`),
    ]).pipe(
        map(([re, photoObjs]) => {
          const photos = (photoObjs ?? []).map((p: any) => p.url as string);
          return toProperty(post, re, photos);
        })
    );
  }

  private enrichPosts(posts: any[]): Observable<Property[]> {
    if (!posts.length) return of([]);
    return forkJoin(posts.map(post => this.enrichPost(post)));
  }

  list(filters: PropertyFilters = {}): Observable<Property[]> {
    let params = new HttpParams();
    if (filters.sortBy)                   params = params.set('sortBy', filters.sortBy);
    if (filters.direction)                params = params.set('direction', filters.direction);
    if (filters.q)                        params = params.set('q', filters.q);
    if (filters.city)                     params = params.set('city', filters.city);
    if (filters.category)                 params = params.set('category', filters.category);
    if (filters.listingType)              params = params.set('listingType', filters.listingType);
    if (filters.minPrice != null)         params = params.set('minPrice', filters.minPrice);
    if (filters.maxPrice != null)         params = params.set('maxPrice', filters.maxPrice);
    if (filters.minSquareMeters != null)  params = params.set('minSquareMeters', filters.minSquareMeters);
    if (filters.maxSquareMeters != null)  params = params.set('maxSquareMeters', filters.maxSquareMeters);
    return this.http.get<any[]>(this.base, { params }).pipe(
        switchMap(posts => this.enrichPosts(posts))
    );
  }

  get(id: number): Observable<Property> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
        switchMap(post => this.enrichPost(post))
    );
  }

  mine(): Observable<Property[]> {
    const user = this.auth.user();
    if (!user) return of([]);
    return this.http.get<any[]>(`${this.base}/seller/${user.id}`).pipe(
        switchMap(posts => this.enrichPosts(posts))
    );
  }

  getBySeller(sellerId: number): Observable<Property[]> {
    return this.http.get<any[]>(`${this.base}/seller/${sellerId}`).pipe(
        switchMap(posts => this.enrichPosts(posts))
    );
  }

  getRealEstate(id: number): Observable<RealEstateDto> {
    return this.http.get<RealEstateDto>(`${this.reBase}/${id}`);
  }

  updateRealEstate(id: number, data: RealEstateRequest): Observable<RealEstateDto> {
    return this.http.patch<RealEstateDto>(`${this.reBase}/${id}`, data);
  }

  createWithRealEstate(dto: PostCreateDto): Observable<Post> {
    return this.http.post<Post>(`${this.base}/with-realestate`, dto);
  }

  update(id: number, data: any): Observable<Property> {
    return this.http.put<any>(`${this.base}/${id}`, data).pipe(
        switchMap(post => this.enrichPost(post))
    );
  }

  updateAsAdmin(id: number, data: any): Observable<Property> {
    return this.http.put<any>(`${this.adminBase}/posts/${id}`, data).pipe(
        switchMap(post => this.enrichPost(post))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  lowerPrice(id: number, newPrice: number): Observable<Property> {
    return this.http.patch<any>(`${this.base}/${id}/reduce-price`, { newPrice }).pipe(
        switchMap(post => this.enrichPost(post))
    );
  }

}