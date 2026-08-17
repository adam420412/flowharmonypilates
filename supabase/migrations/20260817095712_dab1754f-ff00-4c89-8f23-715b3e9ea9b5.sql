WITH ranked AS (
  SELECT c.id,
         ROW_NUMBER() OVER (
           PARTITION BY c.starts_at, c.class_type_id
           ORDER BY (SELECT count(*) FROM public.bookings b WHERE b.class_id = c.id) DESC,
                    (SELECT count(*) FROM public.payments p WHERE p.class_id = c.id) DESC,
                    c.created_at ASC
         ) AS rn
  FROM public.classes c
), doomed AS (
  SELECT r.id FROM ranked r
  WHERE r.rn > 1
    AND NOT EXISTS (SELECT 1 FROM public.bookings b WHERE b.class_id = r.id)
    AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.class_id = r.id)
)
DELETE FROM public.classes c USING doomed d WHERE c.id = d.id;