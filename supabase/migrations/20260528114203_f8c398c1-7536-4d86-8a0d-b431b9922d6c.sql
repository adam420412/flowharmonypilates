UPDATE auth.users 
SET email = 'joanna@flowharmony.pl',
    email_change = '',
    email_change_token_new = '',
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'joannakonieczna@flowharmony.pl';

UPDATE auth.identities
SET identity_data = jsonb_set(identity_data, '{email}', '"joanna@flowharmony.pl"'),
    updated_at = now()
WHERE provider = 'email' 
  AND identity_data->>'email' = 'joannakonieczna@flowharmony.pl';