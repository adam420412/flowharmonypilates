
CREATE OR REPLACE FUNCTION public.try_redeem_package_for_booking(_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_b RECORD;
  v_slug text;
  v_pkg_id uuid;
BEGIN
  SELECT * INTO v_b FROM public.bookings WHERE id = _booking_id;
  IF NOT FOUND THEN RETURN false; END IF;

  IF EXISTS (SELECT 1 FROM public.package_redemptions WHERE booking_id = _booking_id)
     OR EXISTS (SELECT 1 FROM public.payments WHERE booking_id = _booking_id AND status = 'paid') THEN
    RETURN true;
  END IF;

  SELECT ct.slug INTO v_slug
  FROM public.classes c JOIN public.class_types ct ON ct.id = c.class_type_id
  WHERE c.id = v_b.class_id;

  SELECT p.id INTO v_pkg_id
  FROM public.user_packages p
  WHERE p.user_id = v_b.user_id
    AND p.expires_at > now()
    AND v_slug = ANY(p.class_type_slugs)
    AND p.credits_total > (
      SELECT COUNT(*) FROM public.package_redemptions r
      JOIN public.bookings b ON b.id = r.booking_id
      WHERE r.package_id = p.id AND b.status <> 'cancelled')
  ORDER BY p.expires_at ASC
  LIMIT 1;

  IF v_pkg_id IS NULL THEN RETURN false; END IF;

  INSERT INTO public.package_redemptions (package_id, booking_id, user_id)
  VALUES (v_pkg_id, _booking_id, v_b.user_id);

  UPDATE public.bookings SET payment_due_at = NULL, updated_at = now() WHERE id = _booking_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_booking(_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_class RECORD;
  v_hours_before INT;
  v_caller UUID := auth.uid();
  v_promoted UUID;
  v_promoted_booking UUID;
  v_minutes INT;
  v_slug TEXT;
  v_had_redemption BOOLEAN;
  v_payment RECORD;
  v_voucher BOOLEAN := false;
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
  v_hours_before := COALESCE(v_hours_before, 24);

  IF NOT public.has_role(v_caller, 'admin')
     AND v_class.starts_at - now() < make_interval(hours => v_hours_before) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'too_late', 'hours_before', v_hours_before);
  END IF;

  UPDATE public.bookings SET status = 'cancelled', payment_due_at = NULL, updated_at = now() WHERE id = _booking_id;

  IF v_booking.status = 'confirmed' THEN
    SELECT (value::text)::int INTO v_minutes FROM public.app_settings WHERE key = 'unpaid_payment_minutes';
    v_minutes := COALESCE(v_minutes, 1440);

    UPDATE public.bookings SET
      status = 'confirmed',
      payment_due_at = CASE WHEN public.booking_is_paid(id) THEN NULL ELSE now() + make_interval(mins => v_minutes) END,
      updated_at = now()
    WHERE id = (
      SELECT id FROM public.bookings
      WHERE class_id = v_booking.class_id AND status = 'waitlist'
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING user_id, id INTO v_promoted, v_promoted_booking;

    IF v_promoted_booking IS NOT NULL THEN
      PERFORM public.try_redeem_package_for_booking(v_promoted_booking);
    END IF;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.package_redemptions WHERE booking_id = _booking_id)
    INTO v_had_redemption;

  IF NOT v_had_redemption THEN
    SELECT * INTO v_payment
    FROM public.payments
    WHERE booking_id = _booking_id AND status = 'paid'
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      SELECT ct.slug INTO v_slug FROM public.class_types ct WHERE ct.id = v_class.class_type_id;
      INSERT INTO public.user_packages (
        user_id, payment_id, package_code, package_name,
        credits_total, class_type_slugs, expires_at
      ) VALUES (
        v_booking.user_id, v_payment.id, 'voucher-1',
        'Wejście z odwołanych zajęć',
        1, ARRAY[v_slug], now() + interval '60 days'
      );
      v_voucher := true;
    END IF;
  END IF;

  RETURN jsonb_build_object('ok', true, 'promoted_user_id', v_promoted, 'promoted_booking_id', v_promoted_booking, 'voucher_granted', v_voucher);
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_unpaid_bookings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_minutes INT;
  v_expired INT := 0;
  v_promotions jsonb := '[]'::jsonb;
  v_promoted UUID;
  v_promoted_booking UUID;
BEGIN
  SELECT (value::text)::int INTO v_minutes FROM public.app_settings WHERE key = 'unpaid_payment_minutes';
  v_minutes := COALESCE(v_minutes, 1440);

  FOR r IN
    SELECT b.id, b.class_id
    FROM public.bookings b
    WHERE b.status = 'confirmed'
      AND b.payment_due_at IS NOT NULL
      AND b.payment_due_at < now()
      AND NOT public.booking_is_paid(b.id)
  LOOP
    UPDATE public.bookings SET status = 'cancelled', payment_due_at = NULL, updated_at = now() WHERE id = r.id;
    v_expired := v_expired + 1;

    v_promoted := NULL;
    v_promoted_booking := NULL;
    UPDATE public.bookings SET
      status = 'confirmed',
      payment_due_at = CASE WHEN public.booking_is_paid(id) THEN NULL ELSE now() + make_interval(mins => v_minutes) END,
      updated_at = now()
    WHERE id = (
      SELECT id FROM public.bookings
      WHERE class_id = r.class_id AND status = 'waitlist'
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING user_id, id INTO v_promoted, v_promoted_booking;

    IF v_promoted_booking IS NOT NULL THEN
      PERFORM public.try_redeem_package_for_booking(v_promoted_booking);
    END IF;

    IF v_promoted IS NOT NULL THEN
      v_promotions := v_promotions || jsonb_build_object(
        'class_id', r.class_id, 'user_id', v_promoted, 'booking_id', v_promoted_booking
      );
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'expired', v_expired, 'promotions', v_promotions);
END;
$$;

REVOKE ALL ON FUNCTION public.try_redeem_package_for_booking(uuid) FROM public, anon, authenticated;
