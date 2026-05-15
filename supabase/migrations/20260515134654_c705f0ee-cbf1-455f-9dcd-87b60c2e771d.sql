-- Cap capacity column at 4 going forward (default 4)
ALTER TABLE public.classes ALTER COLUMN capacity SET DEFAULT 4;
UPDATE public.classes SET capacity = 4 WHERE capacity > 4;

-- Drop & recreate constraint via trigger (immutable-safe, allows messages)
CREATE OR REPLACE FUNCTION public.enforce_class_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap int;
  v_confirmed int;
BEGIN
  IF NEW.status <> 'confirmed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND OLD.class_id = NEW.class_id THEN
    RETURN NEW;
  END IF;

  SELECT LEAST(capacity, 4) INTO v_cap FROM public.classes WHERE id = NEW.class_id;
  IF v_cap IS NULL THEN v_cap := 4; END IF;

  SELECT COUNT(*) INTO v_confirmed
  FROM public.bookings
  WHERE class_id = NEW.class_id
    AND status = 'confirmed'
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF v_confirmed >= v_cap THEN
    RAISE EXCEPTION 'Brak wolnych miejsc — limit % zarezerwowanych miejsc został osiągnięty.', v_cap
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_class_capacity ON public.bookings;
CREATE TRIGGER trg_enforce_class_capacity
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_class_capacity();