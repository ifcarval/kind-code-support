-- Ensure master profile and correct roles for igor.carvalho76@gmail.com
DO $$ 
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email ILIKE 'igor.carvalho76@gmail.com' LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, nome, role)
        VALUES (v_user_id, 'igor.carvalho76@gmail.com', 'Igor Carvalho', 'master')
        ON CONFLICT (id) DO UPDATE 
        SET role = 'master', nome = COALESCE(public.profiles.nome, 'Igor Carvalho');
    END IF;
END $$;
