-- Resolve linter warnings for SECURITY DEFINER functions
-- Using correct type name 'app_user_role' which was created in previous turns

DO $$
BEGIN
    -- Revoke from is_lifetime_admin
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_lifetime_admin') THEN
        REVOKE EXECUTE ON FUNCTION public.is_lifetime_admin(UUID) FROM PUBLIC;
        REVOKE EXECUTE ON FUNCTION public.is_lifetime_admin(UUID) FROM anon;
        GRANT EXECUTE ON FUNCTION public.is_lifetime_admin(UUID) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.is_lifetime_admin(UUID) TO service_role;
    END IF;

    -- Revoke from has_role
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'has_role') THEN
        REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_user_role) FROM PUBLIC;
        REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_user_role) FROM anon;
        GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_user_role) TO authenticated;
        GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_user_role) TO service_role;
    END IF;
END $$;
