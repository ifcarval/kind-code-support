BEGIN;

-- These tables serve internal modules. Rebuild their policies as a set so a
-- legacy permissive rule cannot widen access through PostgreSQL's OR behavior.
DO $$
DECLARE
  table_name text;
  existing_policy record;
  owner_scope text;
  write_scope text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['finances', 'landlords', 'contract_templates']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);

    FOR existing_policy IN
      SELECT policyname FROM pg_catalog.pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', existing_policy.policyname, table_name);
    END LOOP;

    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', table_name);

    owner_scope := format(
      'EXISTS (
        SELECT 1 FROM public.organization_members AS membership
        WHERE membership.user_id = (SELECT auth.uid())
          AND membership.organization_id = %I.organization_id
          AND membership.role = ''owner''
      )', table_name
    );
    write_scope := owner_scope;

    IF table_name = 'finances' THEN
      write_scope := write_scope || '
        AND (finances.event_id IS NULL OR EXISTS (
          SELECT 1 FROM public.events AS event
          WHERE event.id = finances.event_id
            AND event.organization_id = finances.organization_id
        ))
        AND (finances.contract_id IS NULL OR EXISTS (
          SELECT 1 FROM public.contracts AS contract
          WHERE contract.id = finances.contract_id
            AND contract.organization_id = finances.organization_id
        ))';
    END IF;

    EXECUTE format(
      'CREATE POLICY organization_owner_access ON public.%I
       FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
      table_name, owner_scope, write_scope
    );
    EXECUTE format(
      'CREATE POLICY organization_owner_boundary ON public.%I
       AS RESTRICTIVE FOR ALL TO anon, authenticated
       USING (%s) WITH CHECK (%s)',
      table_name, owner_scope, write_scope
    );
  END LOOP;
END;
$$;

-- Preserve the authenticated portal while blocking anonymous access to
-- contracts and versions, including access from legacy grants or policies.
CREATE POLICY contracts_deny_anonymous ON public.contracts
  AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY contract_versions_deny_anonymous ON public.contract_versions
  AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false);
REVOKE ALL ON public.contracts, public.contract_versions FROM anon, PUBLIC;

NOTIFY pgrst, 'reload schema';
COMMIT;
