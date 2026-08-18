UPDATE public.class_types SET description = 'Grupowe zajęcia pilates na reformerach — kameralna grupa maksymalnie 4 osób.', updated_at = now() WHERE slug = 'reformer-basic';

UPDATE public.classes c SET capacity = 4, updated_at = now()
FROM public.class_types t
WHERE c.class_type_id = t.id AND t.slug IN ('reformer-basic','reformer-flow') AND c.capacity > 4;