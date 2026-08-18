DO $$
DECLARE ids uuid[] := ARRAY[
  '67550bca-8837-46b5-84aa-5341a090fac7',
  'bb7a7bf0-e121-4641-aa3d-10889b54b05b',
  'fcd81d79-0a9e-4672-bbb8-09e30da3825a',
  '32ef8f72-4484-4cad-85bc-d6dc5164da05'
]::uuid[];
BEGIN
  DELETE FROM public.package_redemptions r USING public.bookings b WHERE r.booking_id = b.id AND b.class_id = ANY(ids);
  UPDATE public.payments SET booking_id = NULL WHERE booking_id IN (SELECT id FROM public.bookings WHERE class_id = ANY(ids));
  UPDATE public.payments SET class_id = NULL WHERE class_id = ANY(ids);
  DELETE FROM public.bookings WHERE class_id = ANY(ids);
  DELETE FROM public.classes WHERE id = ANY(ids);
END $$;