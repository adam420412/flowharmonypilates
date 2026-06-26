
-- Allow guest checkout: lookup helper + flag column
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_guest boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.find_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO service_role;
