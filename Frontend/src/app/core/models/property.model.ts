export type RealEstateType =
    | 'APARTMENT'
    | 'VILLA'
    | 'GARAGE'
    | 'BUILDING_LOT'
    | 'NON_BUILDING_LOT';

export type PropertyCategory = 'APARTMENT' | 'VILLA' | 'GARAGE' | 'LAND';
export type ListingType = 'SALE' | 'RENT';

export interface RealEstateRequest {
    type: RealEstateType;
    title: string;
    numberOfRooms: number;
    description: string;
    squareMetres: number;
    street: string;
    civicNumber: string;
    city: string;
    cap: string;
    province: string;
    floor?: number;
    hasElevator?: boolean;
    hasGarden?: boolean;
    hasPool?: boolean;
    numberOfFloors?: number;
    width?: number;
    height?: number;
    isElectric?: boolean;
    cubature?: number;
    plannedUse?: string;
    cropType?: string;
}

export interface PostCreateDto {
    title: string;
    description: string;
    currentPrice: number;
    photoUrls: { url: string }[];
    realEstate: RealEstateRequest;
    listingType: ListingType;
}

export interface PostUpdateDto {
    title: string;
    description: string;
    currentPrice: number;
    realEstateId: number;
    photoUrls: { url: string }[];
    listingType: ListingType;
}

export interface Post {
    id: number;
    title: string;
    description: string;
    previousPrice: number;
    currentPrice: number;
    createdAt: string;
    sellerId: number;
    realEstateId: number;
    photoUrls: { url: string }[];
    listingType: ListingType;
}

export interface RealEstateDto {
    id: number;
    title: string;
    numberOfRooms: number;
    description: string;
    squareMetres: number;
    latit: number;
    longit: number;
    address: string;
    createdAt: string;
    type: string;
}

export interface Property {
    id: number;
    code: string;
    title: string;
    description: string;
    category: PropertyCategory;
    categoryLabel?: string;
    listingType: ListingType;
    price: number;
    oldPrice?: number | null;
    squareMeters: number;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    photos: string[];
    sellerId: number;
    realEstateId?: number | null;
    sellerName?: string;
    createdAt: string;
    numberOfRooms?: number | null;
    floor?: number | null;
    hasElevator?: boolean;
    hasGarden?: boolean;
    hasPool?: boolean;
    width?: number | null;
    height?: number | null;
    isElectric?: boolean;
    cubature?: number | null;
    plannedUse?: string | null;
    cropType?: string | null;
    sold: boolean;
}

export interface PropertyFilters {
    q?: string;
    city?: string;
    category?: PropertyCategory;
    listingType?: ListingType;
    minPrice?: number;
    maxPrice?: number;
    minSquareMeters?: number;
    maxSquareMeters?: number;
    sort?: 'price-asc' | 'price-desc' | 'sqm-desc' | 'newest';
    sortBy?: string;
    direction?: 'asc' | 'desc';
}

export type DynamicFilterType = 'boolean' | 'number';

export interface DynamicFilterDef {
    key: keyof Property;
    label: string;
    type: DynamicFilterType;
}

export const CATEGORY_DYNAMIC_FILTERS: Partial<Record<PropertyCategory, DynamicFilterDef[]>> = {
    VILLA: [
        { key: 'hasPool',         label: 'Piscina',             type: 'boolean' },
        { key: 'hasGarden',       label: 'Giardino',            type: 'boolean' },
        { key: 'numberOfRooms',   label: 'Stanze minime',       type: 'number'  },
    ],
    APARTMENT: [
        { key: 'hasElevator',     label: 'Ascensore',           type: 'boolean' },
        { key: 'floor',           label: 'Piano minimo',        type: 'number'  },
        { key: 'numberOfRooms',   label: 'Stanze minime',       type: 'number'  },
    ],
    GARAGE: [
        { key: 'isElectric',      label: 'Colonnina ricarica',  type: 'boolean' },
        { key: 'width',           label: 'Larghezza minima (m)', type: 'number' },
        { key: 'height',          label: 'Altezza minima (m)',   type: 'number' },
    ],
    LAND: [
        { key: 'cubature',        label: 'Cubatura minima (m³)', type: 'number' },
    ],
};

export const REAL_ESTATE_TYPE_TO_CATEGORY: Record<string, PropertyCategory> = {
    APARTMENT:        'APARTMENT',
    VILLA:            'VILLA',
    GARAGE:           'GARAGE',
    BUILDING_LOT:     'LAND',
    NON_BUILDING_LOT: 'LAND'
};

export const REAL_ESTATE_TYPE_LABELS: Record<string, string> = {
    APARTMENT:        'Appartamento',
    VILLA:            'Villa',
    GARAGE:           'Box auto',
    BUILDING_LOT:     'Terreno edificabile',
    NON_BUILDING_LOT: 'Terreno non edificabile',
};

export const CATEGORY_LABELS: Record<PropertyCategory, string> = {
    APARTMENT:  'Appartamento',
    VILLA:      'Villa',
    GARAGE:     'Box auto',
    LAND:       'Terreno',
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
    SALE: 'Vendita',
    RENT: 'Affitto',
};