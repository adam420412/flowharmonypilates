
-- Phone + SMS consent on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sms_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_opt_in_at timestamptz;

-- Notification log (idempotency + audit)
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  booking_id uuid,
  class_id uuid,
  channel text NOT NULL CHECK (channel IN ('email','sms')),
  kind text NOT NULL CHECK (kind IN ('booking_confirmation','reminder_24h','reminder_2h_sms','booking_cancelled','waitlist_promoted')),
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','skipped')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, channel, kind)
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON public.notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_class ON public.notification_log(class_id);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notification_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage notifications"
  ON public.notification_log FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Default app settings for notifications
INSERT INTO public.app_settings (key, value, description) VALUES
  ('notifications_email_enabled', 'true'::jsonb, 'Czy wysyłać powiadomienia email'),
  ('notifications_sms_enabled', 'true'::jsonb, 'Czy wysyłać powiadomienia SMS'),
  ('reminder_email_hours_before', '24'::jsonb, 'Ile godzin przed zajęciami wysłać przypomnienie email'),
  ('reminder_sms_hours_before', '2'::jsonb, 'Ile godzin przed zajęciami wysłać przypomnienie SMS')
ON CONFLICT (key) DO NOTHING;
