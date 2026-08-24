-- 1. Ensure enum and columns exist (from previous turn, but just in case)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_user_role') THEN
        CREATE TYPE public.app_user_role AS ENUM ('owner', 'user');
    END IF;
END $$;

-- 2. Create app_admins table to track lifetime administrators
CREATE TABLE IF NOT EXISTS public.app_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

GRANT SELECT ON public.app_admins TO authenticated;
GRANT ALL ON public.app_admins TO service_role;

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admins" ON public.app_admins
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid())
        OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'igor.felipe76@gmail.com'
    );

-- 3. Security definer function for lifetime admin check
CREATE OR REPLACE FUNCTION public.is_lifetime_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users WHERE id = _user_id AND email = 'igor.felipe76@gmail.com'
    ) OR EXISTS (
        SELECT 1 FROM public.app_admins WHERE user_id = _user_id
    );
END;
$$;

-- 4. Set Igor's company to Lifetime status if user exists
-- Note: This requires the user to already be signed up. 
-- We'll also update the profiles table directly if needed.

DO $$
DECLARE
    igor_id UUID;
    igor_company_id UUID;
BEGIN
    SELECT id INTO igor_id FROM auth.users WHERE email = 'igor.felipe76@gmail.com';
    
    IF igor_id IS NOT NULL THEN
        -- Add to app_admins
        INSERT INTO public.app_admins (user_id) VALUES (igor_id) ON CONFLICT DO NOTHING;
        
        -- Get company_id
        SELECT company_id INTO igor_company_id FROM public.profiles WHERE id = igor_id;
        
        IF igor_company_id IS NOT NULL THEN
            UPDATE public.companies 
            SET subscription_status = 'vitalicia',
                trial_ends_at = NULL
            WHERE id = igor_company_id;
        END IF;
        
        -- Ensure profile has owner role
        UPDATE public.profiles SET role = 'owner' WHERE id = igor_id;
    END IF;
END $$;

-- 5. Update RLS on profiles and companies for Admin access
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.is_lifetime_admin(auth.uid()));

CREATE POLICY "Admins can view all companies" ON public.companies
    FOR SELECT TO authenticated USING (public.is_lifetime_admin(auth.uid()));

GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
