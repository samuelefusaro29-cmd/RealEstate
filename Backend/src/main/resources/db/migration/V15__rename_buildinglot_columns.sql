ALTER TABLE public.real_estate
    RENAME COLUMN volume TO cubature;

ALTER TABLE public.real_estate
    RENAME COLUMN destination_use TO land_use;