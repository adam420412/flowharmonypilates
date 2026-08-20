DO $$
DECLARE ids uuid[];
BEGIN
  SELECT array_agg(id) INTO ids FROM public.classes
  WHERE (starts_at AT TIME ZONE 'Europe/Warsaw')::date = DATE '2026-08-20';
  IF ids IS NULL THEN RETURN; END IF;

  DELETE FROM public.package_redemptions WHERE booking_id IN (SELECT id FROM public.bookings WHERE class_id = ANY(ids));
  DELETE FROM public.notification_log WHERE class_id = ANY(ids) OR booking_id IN (SELECT id FROM public.bookings WHERE class_id = ANY(ids));
  UPDATE public.payments SET booking_id = NULL, class_id = NULL WHERE class_id = ANY(ids) OR booking_id IN (SELECT id FROM public.bookings WHERE class_id = ANY(ids));
  DELETE FROM public.bookings WHERE class_id = ANY(ids);
  DELETE FROM public.classes WHERE id = ANY(ids);
END $$;