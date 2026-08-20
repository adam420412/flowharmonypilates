INSERT INTO public.classes (class_type_id, instructor_id, starts_at, duration_minutes, capacity, waitlist_capacity, created_at)
SELECT ct.id, i.id, (date_trunc('day', (now() AT TIME ZONE 'Europe/Warsaw')) + interval '21 hours') AT TIME ZONE 'Europe/Warsaw', 50, 4, 4, now() - interval '10 minutes'
FROM public.class_types ct, public.instructors i
WHERE ct.slug ILIKE '%reformer%' AND i.full_name = 'Anna Kowalska'
LIMIT 1;