CREATE TABLE public.user_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id),
  package_code text NOT NULL,
  package_name text NOT NULL,
  credits_total integer NOT NULL CHECK (credits_total > 0),
  class_type_slugs text[] NOT NULL DEFAULT '{}',
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_packages TO authenticated;
GRANT ALL ON public.user_packages TO service_role;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own packages" ON public.user_packages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage packages" ON public.user_packages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_packages_updated_at BEFORE UPDATE ON public.user_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.package_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.user_packages(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.package_redemptions TO authenticated;
GRANT ALL ON public.package_redemptions TO service_role;
ALTER TABLE public.package_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redemptions" ON public.package_redemptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage redemptions" ON public.package_redemptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.my_active_packages()
RETURNS TABLE(
  id uuid,
  package_code text,
  package_name text,
  credits_total integer,
  credits_used integer,
  credits_left integer,
  class_type_slugs text[],
  expires_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.package_code, p.package_name, p.credits_total,
    u.used::int,
    (p.credits_total - u.used)::int,
    p.class_type_slugs, p.expires_at
  FROM public.user_packages p
  CROSS JOIN LATERAL (
    SELECT COUNT(*) AS used
    FROM public.package_redemptions r
    JOIN public.bookings b ON b.id = r.booking_id
    WHERE r.package_id = p.id AND b.status <> 'cancelled'
  ) u
  WHERE p.user_id = auth.uid()
    AND p.expires_at > now()
  ORDER BY p.expires_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.my_active_packages() TO authenticated;

CREATE OR REPLACE FUNCTION public.book_with_package(_class_id uuid, _package_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_class RECORD;
  v_slug text;
  v_pkg RECORD;
  v_used int;
  v_confirmed int;
  v_booking_id uuid;
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

  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE class_id = _class_id AND user_id = v_user AND status IN ('confirmed','waitlist')
  ) THEN
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

  INSERT INTO public.bookings (class_id, user_id, status)
  VALUES (_class_id, v_user, 'confirmed')
  RETURNING id INTO v_booking_id;

  INSERT INTO public.package_redemptions (package_id, booking_id, user_id)
  VALUES (v_pkg.id, v_booking_id, v_user);

  RETURN jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'credits_left', v_pkg.credits_total - v_pkg.used - 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_with_package(uuid, uuid) TO authenticated;