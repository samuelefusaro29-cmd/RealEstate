import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import { PhotoService } from '../../core/services/photo.service';
import { AuthService } from '../../core/services/auth.service';   // ✅ NUOVO
import {
  PostCreateDto,
  PostUpdateDto,
  REAL_ESTATE_TYPE_LABELS,
  RealEstateRequest,
  RealEstateType
} from '../../core/models';

interface AddressSuggestion {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    'ISO3166-2-lvl6'?: string;
  };
}

@Component({
  selector: 'app-property-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './property-edit.component.html',
  styleUrls: ['./property-edit.component.css'],
})
export class PropertyEditComponent implements OnInit {
  private svc      = inject(PropertyService);
  private photoSvc = inject(PhotoService);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  protected auth     = inject(AuthService);

  protected isNew        = true;
  protected saving       = signal(false);
  protected uploading    = signal(false);
  protected error        = signal<string | null>(null);
  protected uploadedUrls = signal<string[]>([]);
  private   pendingFiles: File[] = [];

  private postId:       number | null = null;
  private realEstateId: number | null = null;

  protected addressSuggestions = signal<AddressSuggestion[]>([]);
  protected showSuggestions    = signal(false);
  private   searchTimeout: any = null;

  protected categories: { value: RealEstateType; label: string }[] = (
      ['APARTMENT', 'VILLA', 'GARAGE', 'BUILDING_LOT', 'NON_BUILDING_LOT'] as RealEstateType[]
  ).map(v => ({ value: v, label: REAL_ESTATE_TYPE_LABELS[v] }));

  protected model = {
    title:       '',
    description: '',
    listingType: 'SALE' as 'SALE' | 'RENT',
    price:       null as number | null,
  };

  protected re = {
    type:          'APARTMENT' as RealEstateType,
    numberOfRooms: null as number | null,
    squareMetres:  null as number | null,
    street:        '',
    civicNumber:   '',
    city:          '',
    cap:           '',
    province:      '',
  };

  protected apartment   = { floor: null as number | null, hasElevator: false };
  protected villa       = { hasGarden: false, hasPool: false, numberOfFloors: null as number | null };
  protected garage      = { width: null as number | null, height: null as number | null, isElectric: false };
  protected buildingLot = { cubature: null as number | null, plannedUse: '' };
  protected nonBuilding = { cropType: '' };

  private parseAddress(address: string) {
    const result = { street: '', civicNumber: '', cap: '', city: '', province: '' };
    if (!address) return result;
    const [firstPart, secondPart] = address.split(',');
    if (firstPart) {
      const tokens = firstPart.trim().split(/\s+/);
      const last = tokens[tokens.length - 1];
      if (/^\d+$/.test(last)) {
        result.civicNumber = last;
        result.street = tokens.slice(0, -1).join(' ');
      } else {
        result.street = firstPart.trim();
      }
    }
    if (secondPart) {
      const match = secondPart.trim().match(/^(\d+)\s+(.+?)\s*\((.+)\)\s*$/);
      if (match) {
        result.cap      = match[1];
        result.city     = match[2];
        result.province = match[3];
      }
    }
    return result;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isNew = false;
    this.svc.get(Number(id)).subscribe({
      next: (p) => {
        this.postId       = p.id;
        this.realEstateId = p.realEstateId ?? null;
        this.model = {
          title:       p.title,
          description: p.description,
          listingType: p.listingType,
          price:       p.price,
        };
        this.uploadedUrls.set(p.photos ?? []);
        const parsed = this.parseAddress(p.address);
        this.re = {
          type:          p.category as RealEstateType,
          numberOfRooms: null,
          squareMetres:  p.squareMeters ?? null,
          street:        parsed.street,
          civicNumber:   parsed.civicNumber,
          city:          parsed.city,
          cap:           parsed.cap,
          province:      parsed.province,
        };
        if (this.realEstateId) {
          this.svc.getRealEstate(this.realEstateId).subscribe({
            next: (re: any) => {
              this.re.numberOfRooms = re.numberOfRooms ?? null;
              this.re.squareMetres  = re.squareMetres  ?? null;
              if (re.floor          != null) this.apartment.floor        = re.floor;
              if (re.hasElevator    != null) this.apartment.hasElevator  = re.hasElevator;
              if (re.hasGarden      != null) this.villa.hasGarden        = re.hasGarden;
              if (re.hasPool        != null) this.villa.hasPool          = re.hasPool;
              if (re.numberOfFloors != null) this.villa.numberOfFloors   = re.numberOfFloors;
              if (re.width          != null) this.garage.width           = re.width;
              if (re.height         != null) this.garage.height          = re.height;
              if (re.isElectric     != null) this.garage.isElectric      = re.isElectric;
              if (re.cubature       != null) this.buildingLot.cubature   = re.cubature;
              if (re.plannedUse     != null) this.buildingLot.plannedUse = re.plannedUse;
              if (re.cropType       != null) this.nonBuilding.cropType   = re.cropType;
            },
          });
        }
      },
    });
  }

  protected onStreetInput(): void {
    clearTimeout(this.searchTimeout);
    const query = this.re.street.trim();
    if (query.length < 4) {
      this.addressSuggestions.set([]);
      this.showSuggestions.set(false);
      return;
    }
    this.searchTimeout = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=it&addressdetails=1&format=json&limit=5`)
          .then(r => r.json())
          .then((results: AddressSuggestion[]) => {
            this.addressSuggestions.set(results.filter(r => r.address?.road));
            this.showSuggestions.set(this.addressSuggestions().length > 0);
          })
          .catch(() => {});
    }, 400);
  }

  protected selectSuggestion(s: AddressSuggestion): void {
    const a = s.address;
    this.re.street      = a.road ?? this.re.street;
    this.re.civicNumber = a.house_number ?? this.re.civicNumber;
    this.re.cap         = a.postcode ?? this.re.cap;
    this.re.city        = a.city ?? a.town ?? a.village ?? this.re.city;
    const lvl6 = (a as any)['ISO3166-2-lvl6'] ?? '';
    this.re.province = lvl6 ? lvl6.replace('IT-', '') : (a as any).county ?? '';
    this.addressSuggestions.set([]);
    this.showSuggestions.set(false);
  }

  protected hideSuggestions(): void {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    files.forEach(file => {
      this.uploadedUrls.update(urls => [...urls, URL.createObjectURL(file)]);
    });
    this.pendingFiles = [...this.pendingFiles, ...files];
    input.value = '';
  }

  protected removePhoto(url: string): void {
    if (url.startsWith('blob:')) {
      const blobsBefore = this.uploadedUrls().filter(u => u.startsWith('blob:'));
      const idx = blobsBefore.indexOf(url);
      if (idx !== -1) this.pendingFiles.splice(idx, 1);
    }
    this.uploadedUrls.update(urls => urls.filter(u => u !== url));
  }

  private extraFields(): Partial<RealEstateRequest> {
    switch (this.re.type) {
      case 'APARTMENT':
        return { floor: this.apartment.floor ?? undefined, hasElevator: this.apartment.hasElevator };
      case 'VILLA':
        return { hasGarden: this.villa.hasGarden, hasPool: this.villa.hasPool, numberOfFloors: this.villa.numberOfFloors ?? undefined };
      case 'GARAGE':
        return { width: this.garage.width ?? undefined, height: this.garage.height ?? undefined, isElectric: this.garage.isElectric };
      case 'BUILDING_LOT':
        return { cubature: this.buildingLot.cubature ?? undefined, plannedUse: this.buildingLot.plannedUse };
      case 'NON_BUILDING_LOT':
        return { cropType: this.nonBuilding.cropType };
      default:
        return {};
    }
  }

  private buildRealEstateDto(): RealEstateRequest {
    return {
      type:          this.re.type,
      title:         this.model.title,
      numberOfRooms: this.re.numberOfRooms ?? 0,
      description:   this.model.description,
      squareMetres:  this.re.squareMetres  ?? 0,
      street:        this.re.street,
      civicNumber:   this.re.civicNumber,
      city:          this.re.city,
      cap:           this.re.cap,
      province:      this.re.province,
      ...this.extraFields(),
    };
  }

  private uploadPending(postId: number, onDone: () => void): void {
    if (!this.pendingFiles.length) { onDone(); return; }
    this.uploading.set(true);
    let done = 0;
    const total = this.pendingFiles.length;
    [...this.pendingFiles].forEach(file => {
      this.photoSvc.upload(file, postId).subscribe({
        next: () => {
          done++;
          if (done === total) { this.uploading.set(false); this.pendingFiles = []; onDone(); }
        },
        error: () => {
          done++;
          if (done === total) { this.uploading.set(false); this.pendingFiles = []; onDone(); }
        },
      });
    });
  }


  private navigateAfterSave(): void {
    if (this.auth.hasRole('ADMIN')) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/seller']);
    }
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set(null);

    const onError = (e: any) => {
      this.error.set(e?.error?.message ?? e?.message ?? 'Errore durante il salvataggio.');
      this.saving.set(false);
    };

    const navigate = () => this.navigateAfterSave();

    if (this.isNew) {
      const dto: PostCreateDto = {
        title:        this.model.title,
        description:  this.model.description,
        currentPrice: this.model.price ?? 0,
        photoUrls:    [],
        realEstate:   this.buildRealEstateDto(),
        listingType:  this.model.listingType,
      };
      this.svc.createWithRealEstate(dto).subscribe({
        next: created => this.uploadPending(created.id, navigate),
        error: onError,
      });
    } else {
      const postId = this.postId!;
      const postDto: PostUpdateDto = {
        title:        this.model.title,
        description:  this.model.description,
        currentPrice: this.model.price ?? 0,
        realEstateId: this.realEstateId!,
        listingType:  this.model.listingType,
        photoUrls:    this.uploadedUrls()
            .filter(u => !u.startsWith('blob:'))
            .map(u => ({ url: u })),
      };

      const update$ = this.auth.hasRole('ADMIN')
          ? this.svc.updateAsAdmin(postId, postDto)
          : this.svc.update(postId, postDto);

      update$.subscribe({
        next: () => {
          this.svc.updateRealEstate(this.realEstateId!, this.buildRealEstateDto()).subscribe({
            next: () => this.uploadPending(postId, navigate),
            error: onError,
          });
        },
        error: onError,
      });
    }
  }
}