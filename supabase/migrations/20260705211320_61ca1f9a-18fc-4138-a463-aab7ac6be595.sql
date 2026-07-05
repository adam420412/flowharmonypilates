ALTER TABLE public.classes ADD COLUMN price_grosz INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.classes ADD CONSTRAINT classes_price_grosz_positive CHECK (price_grosz >= 0);