CREATE OR REPLACE FUNCTION public.set_class_price_from_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE v_default int;
BEGIN
  IF NEW.price_grosz IS NULL OR NEW.price_grosz = 0 THEN
    SELECT default_price_grosz INTO v_default FROM public.class_types WHERE id = NEW.class_type_id;
    IF v_default IS NOT NULL AND v_default > 0 THEN
      NEW.price_grosz := v_default;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_class_price_from_type ON public.classes;
CREATE TRIGGER trg_set_class_price_from_type
BEFORE INSERT OR UPDATE OF class_type_id, price_grosz ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.set_class_price_from_type();