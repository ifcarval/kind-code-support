BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- Replace the canonical policies while preserving profile reads for the
-- existing admin listing. Profile visibility is handled in the next phase.
DROP POLICY IF EXISTS "Allow authenticated access on profiles" ON public.profiles;
CREATE POLICY profiles_authenticated_read ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Existing permissive policies cannot expand the update to another profile.
CREATE POLICY profiles_update_own_boundary ON public.profiles
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated access on organization_members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners/admins can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners/admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners/admins can delete members" ON public.organization_members;

CREATE POLICY organization_members_read_own ON public.organization_members
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY organization_members_read_own_boundary ON public.organization_members
  AS RESTRICTIVE FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.profiles, public.organization_members
  FROM PUBLIC, anon, authenticated;

-- Table-level revocation leaves separately granted column privileges intact.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT table_name, string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position) AS columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('profiles', 'organization_members')
    GROUP BY table_name
  LOOP
    EXECUTE format(
      'REVOKE ALL (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      target.columns, target.table_name
    );
  END LOOP;
END;
$$;

GRANT SELECT ON TABLE public.profiles, public.organization_members TO authenticated;
GRANT UPDATE (nome, avatar_url) ON TABLE public.profiles TO authenticated;

-- Registration already provisions a profile from the Auth trigger.
-- Set the role server-side and copy only the expected contact fields.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  default_company_id uuid;
BEGIN
  INSERT INTO public.companies (nome)
  VALUES ('Minha Empresa') RETURNING id INTO default_company_id;

  INSERT INTO public.profiles (id, company_id, nome, email, telefone, role)
  VALUES (
    NEW.id,
    default_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário Novo'),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    'user'
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
