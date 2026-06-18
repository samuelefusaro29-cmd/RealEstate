import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyService } from '../../core/services/property.service';
import {
  CATEGORY_LABELS, Property, PropertyCategory,
  PropertyFilters, ListingType,
  CATEGORY_DYNAMIC_FILTERS, DynamicFilterDef,
} from '../../core/models';
import { PropertyCardComponent } from '../../shared/components/property-card.component';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PropertyCardComponent],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css'],
})
export class PropertyListComponent implements OnInit, OnDestroy {
  private svc    = inject(PropertyService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  protected allItems  = signal<Property[]>([]);
  protected loading   = signal(true);
  protected error     = signal<string | null>(null);
  protected filters: PropertyFilters = { sort: 'newest' };
  protected dynamicBoolFilters: Record<string, boolean> = {};
  protected dynamicNumFilters:  Record<string, number | null> = {};

  private debounceTimer: any = null;

  protected categories: { value: PropertyCategory; label: string }[] = (
      Object.keys(CATEGORY_LABELS) as PropertyCategory[]
  ).map(v => ({ value: v, label: CATEGORY_LABELS[v] }));

  get dynamicFilterDefs(): DynamicFilterDef[] {
    if (!this.filters.category) return [];
    return CATEGORY_DYNAMIC_FILTERS[this.filters.category] ?? [];
  }

  get items(): Property[] {
    let result = this.allItems();
    for (const def of this.dynamicFilterDefs) {
      if (def.type === 'boolean') {
        const val = this.dynamicBoolFilters[def.key as string];
        if (val === true) {
          result = result.filter(p => (p as any)[def.key] === true);
        }
      } else if (def.type === 'number') {
        const val = this.dynamicNumFilters[def.key as string];
        if (val != null && val > 0) {
          result = result.filter(p => {
            const pVal = (p as any)[def.key];
            return pVal != null && pVal >= val;
          });
        }
      }
    }
    return result;
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.filters = {
      q:               qp.get('q')               ?? undefined,
      city:            qp.get('city')            ?? undefined,
      category:        (qp.get('category')       as PropertyCategory) ?? undefined,
      minPrice:        qp.get('minPrice')        ? Number(qp.get('minPrice'))        : undefined,
      maxPrice:        qp.get('maxPrice')        ? Number(qp.get('maxPrice'))        : undefined,
      minSquareMeters: qp.get('minSquareMeters') ? Number(qp.get('minSquareMeters')) : undefined,
      maxSquareMeters: qp.get('maxSquareMeters') ? Number(qp.get('maxSquareMeters')) : undefined,
      sort:            (qp.get('sort')           as PropertyFilters['sort']) ?? 'newest',
    };
    this.reload();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  onTextChange(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.reload(), 400);
  }

  onCategoryChange(): void {
    this.dynamicBoolFilters = {};
    this.dynamicNumFilters  = {};
    this.reload();
  }

  reload(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.loading.set(true);
    this.error.set(null);

    const apiFilters: PropertyFilters = { ...this.filters };
    switch (this.filters.sort) {
      case 'price-asc':  apiFilters.sortBy = 'price'; apiFilters.direction = 'asc';  break;
      case 'price-desc': apiFilters.sortBy = 'price'; apiFilters.direction = 'desc'; break;
      case 'sqm-desc':   apiFilters.sortBy = 'sqm';   apiFilters.direction = 'desc'; break;
      default:           apiFilters.sortBy = 'date';  apiFilters.direction = 'desc'; break;
    }
    delete apiFilters.sort;

    const qpToSave: Record<string, unknown> = {};
    if (this.filters.q)                       qpToSave['q']               = this.filters.q;
    if (this.filters.city)                    qpToSave['city']            = this.filters.city;
    if (this.filters.category)                qpToSave['category']        = this.filters.category;
    if (this.filters.minPrice != null)        qpToSave['minPrice']        = this.filters.minPrice;
    if (this.filters.maxPrice != null)        qpToSave['maxPrice']        = this.filters.maxPrice;
    if (this.filters.minSquareMeters != null) qpToSave['minSquareMeters'] = this.filters.minSquareMeters;
    if (this.filters.maxSquareMeters != null) qpToSave['maxSquareMeters'] = this.filters.maxSquareMeters;
    if (this.filters.sort)                    qpToSave['sort']            = this.filters.sort;

    this.router.navigate([], { queryParams: qpToSave, replaceUrl: true });

    this.svc.list(apiFilters).subscribe({
      next:  res => { this.allItems.set(res); this.loading.set(false); },
      error: err => {
        this.error.set('Impossibile caricare gli annunci (' + (err?.message ?? 'errore') + ')');
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.filters = { sort: 'newest' };
    this.dynamicBoolFilters = {};
    this.dynamicNumFilters  = {};
    this.reload();
  }
}