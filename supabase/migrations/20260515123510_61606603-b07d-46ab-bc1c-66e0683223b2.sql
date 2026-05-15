CREATE OR REPLACE FUNCTION public.waitlist_position(_booking_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pos FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY class_id ORDER BY created_at ASC)::int AS pos
    FROM public.bookings
    WHERE status = 'waitlist'
      AND class_id = (SELECT class_id FROM public.bookings WHERE id = _booking_id)
  ) t WHERE id = _booking_id;
$$;

GRANT EXECUTE ON FUNCTION public.waitlist_position(uuid) TO authenticated;