UPDATE auth.users 
SET encrypted_password = crypt('FlowHarmony2026!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'joannakonieczna@flowharmony.pl';