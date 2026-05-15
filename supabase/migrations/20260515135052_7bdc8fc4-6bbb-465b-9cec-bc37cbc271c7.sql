CREATE OR REPLACE FUNCTION public.enforce_class_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap int;
  v_type_cap int;
  v_slug text;
  v_confirmed int;
BEGIN
  IF NEW.status <> 'confirmed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND OLD.class_id = NEW.class_id THEN
    RETURN NEW;
  END IF;

  SELECT c.capacity, ct.slug
    INTO v_cap, v_slug
  FROM public.classes c
  JOIN public.class_types ct ON ct.id = c.class_type_id
  WHERE c.id = NEW.class_id;

  v_type_cap := CASE v_slug
    WHEN 'intro' THEN 1
    WHEN 'vip-1on1' THEN 1
    WHEN 'cadillac-1on1' THEN 1
    WHEN 'vip-duo' THEN 2
    ELSE 4
  END;

  v_cap := LEAST(COALESCE(v_cap, v_type_cap), v_type_cap);

  SELECT COUNT(*) INTO v_confirmed
  FROM public.bookings
  WHERE class_id = NEW.class_id
    AND status = 'confirmed'
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_confirmed >= v_cap THEN
    RAISE EXCEPTION 'Brak wolnych miejsc — limit % osób na tych zajęciach został osiągnięty.', v_cap
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_class_capacity() FROM PUBLIC, anon, authenticated;