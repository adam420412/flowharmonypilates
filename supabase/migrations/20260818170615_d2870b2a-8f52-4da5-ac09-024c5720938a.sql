CREATE OR REPLACE FUNCTION public.cancel_booking(_booking_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_booking RECORD;
  v_class RECORD;
  v_hours_before INT;
  v_caller UUID := auth.uid();
  v_promoted UUID;
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

  -- Jednorazowo opłacone zajęcia (bez karnetu) => zwrot w formie 1 wejścia
  SELECT EXISTS (SELECT 1 FROM public.package_redemptions WHERE booking_id = _booking_id)
    INTO v_had_redemption;

  IF NOT v_had_redemption THEN
    SELECT * INTO v_payment
    FROM public.payments
    WHERE booking_id = _booking_id AND status = 'paid'
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      SELECT ct.slug INTO v_slug
      FROM public.class_types ct WHERE ct.id = v_class.class_type_id;

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

  RETURN jsonb_build_object('ok', true, 'promoted_user_id', v_promoted, 'voucher_granted', v_voucher);
END;
$function$;