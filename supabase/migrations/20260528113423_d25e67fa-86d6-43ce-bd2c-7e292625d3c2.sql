ALTER TABLE public.notification_log DROP CONSTRAINT IF EXISTS notification_log_status_check;
ALTER TABLE public.notification_log ADD CONSTRAINT notification_log_status_check
  CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'skipped'::text, 'queued'::text, 'suppressed'::text]));