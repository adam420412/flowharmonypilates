CREATE OR REPLACE FUNCTION public.book_with_package(_class_id uuid, _package_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_class RECORD;
  v_slug text;
  v_pkg RECORD;
  v_confirmed int;
  v_booking_id uuid;
  v_existing RECORD;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Musisz być zalogowana, aby użyć karnetu.');
  END IF;

  SELECT c.*, ct.slug AS type_slug INTO v_class
  FROM public.classes c JOIN public.class_types ct ON ct.id = c.class_type_id
  WHERE c.id = _class_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nie znaleziono zajęć.');
  END IF;
  IF v_class.is_cancelled THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Zajęcia zostały odwołane.');
  END IF;
  IF v_class.starts_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Te zajęcia już się odbyły.');
  END IF;
  v_slug := v_class.type_slug;

  SELECT * INTO v_existing FROM public.bookings
  WHERE class_id = _class_id AND user_id = v_user;

  IF FOUND AND v_existing.status IN ('confirmed','waitlist') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Jesteś już zapisana na te zajęcia.');
  END IF;

  SELECT p.id, p.credits_total,
    (SELECT COUNT(*) FROM public.package_redemptions r
      JOIN public.bookings b ON b.id = r.booking_id
      WHERE r.package_id = p.id AND b.status <> 'cancelled') AS used
  INTO v_pkg
  FROM public.user_packages p
  WHERE p.user_id = v_user
    AND p.expires_at > now()
    AND v_slug = ANY(p.class_type_slugs)
    AND (_package_id IS NULL OR p.id = _package_id)
    AND p.credits_total > (
      SELECT COUNT(*) FROM public.package_redemptions r
      JOIN public.bookings b ON b.id = r.booking_id
      WHERE r.package_id = p.id AND b.status <> 'cancelled')
  ORDER BY p.expires_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nie masz aktywnego karnetu z wejściem na ten typ zajęć.');
  END IF;

  SELECT COUNT(*) INTO v_confirmed FROM public.bookings
  WHERE class_id = _class_id AND status = 'confirmed';
  IF v_confirmed >= v_class.capacity THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Brak wolnych miejsc na tych zajęciach.');
  END IF;

  IF v_existing.id IS NOT NULL THEN
    -- ponowna rezerwacja po odwołaniu: użyj istniejącego wiersza
    v_booking_id := v_existing.id;
    DELETE FROM public.package_redemptions WHERE booking_id = v_booking_id;
    UPDATE public.bookings SET status = 'confirmed', updated_at = now() WHERE id = v_booking_id;
  ELSE
    INSERT INTO public.bookings (class_id, user_id, status)
    VALUES (_class_id, v_user, 'confirmed')
    RETURNING id INTO v_booking_id;
  END IF;

  INSERT INTO public.package_redemptions (package_id, booking_id, user_id)
  VALUES (v_pkg.id, v_booking_id, v_user);

  RETURN jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'credits_left', v_pkg.credits_total - v_pkg.used - 1
  );
END;
$function$;