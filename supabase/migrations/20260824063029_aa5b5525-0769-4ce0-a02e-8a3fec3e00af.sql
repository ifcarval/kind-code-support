
DO $$ BEGIN
    CREATE TYPE public.app_user_role AS ENUM ('owner', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.app_user_role DEFAULT 'owner';

-- Update companies table for trial/subscription
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '15 days'),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Ensure RLS is enabled and grants are correct
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.companies TO service_role;
