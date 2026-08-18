select cron.schedule(
  'expire-unpaid-bookings',
  '* * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://project--845cc697-6a4f-4838-a5a8-c2e75f0e592a.lovable.app/api/public/hooks/expire-unpaid',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $cron$
);