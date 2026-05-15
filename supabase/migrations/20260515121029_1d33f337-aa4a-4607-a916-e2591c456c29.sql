-- SETTINGS
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings public read"
  ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_settings (key, value, description) VALUES
  ('cancellation_hours_before', '12'::jsonb, 'Ile godzin przed zajęciami można odwołać rezerwację bez konsekwencji'),
  ('studio_name', '"Mimosa Pilates"'::jsonb, 'Nazwa studia'),
  ('studio_address', '"Poznańska 117, Kamionki"'::jsonb, 'Adres studia');

-- CANCEL BOOKING (with waitlist promotion)
CREATE OR REPLACE FUNCTION public.cancel_booking(_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_booking RECORD;
  v_class RECORD;
  v_hours_before INT;
  v_caller UUID := auth.uid();
  v_promoted UUID;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthenticated');
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = _booking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_booking.user_id <> v_caller AND NOT public.has_role(v_caller, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_cancelled');
  END IF;

  SELECT * INTO v_class FROM public.classes WHERE id = v_booking.class_id;
  SELECT (value::text)::int INTO v_hours_before FROM public.app_settings WHERE key = 'cancellation_hours_before';
  v_hours_before := COALESCE(v_hours_before, 12);

  IF NOT public.has_role(v_caller, 'admin')
     AND v_class.starts_at - now() < make_interval(hours => v_hours_before) THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'too_late',
      'hours_before', v_hours_before
    );
  END IF;

  UPDATE public.bookings SET status = 'cancelled', updated_at = now() WHERE id = _booking_id;

  -- Promote first waitlist entry only if a confirmed seat freed up
  IF v_booking.status = 'confirmed' THEN
    UPDATE public.bookings SET status = 'confirmed', updated_at = now()
    WHERE id = (
      SELECT id FROM public.bookings
      WHERE class_id = v_booking.class_id AND status = 'waitlist'
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING user_id INTO v_promoted;
  END IF;

  RETURN jsonb_build_object('ok', true, 'promoted_user_id', v_promoted);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.cancel_booking(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();