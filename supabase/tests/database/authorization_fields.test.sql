BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path TO public, extensions;
SELECT plan(9);

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('0daaeea0-730c-4cef-b034-cce300160001', 'rls-a@example.test',
   '{"full_name":"RLS A","phone":"1234","role":"owner"}'),
  ('0daaeea0-730c-4cef-b034-cce300160002', 'rls-b@example.test',
   '{"full_name":"RLS B"}');

SELECT is(
  (SELECT role::text FROM public.profiles WHERE id = '0daaeea0-730c-4cef-b034-cce300160001'),
  'user',
  'Signup ignores the requested privileged role'
);
SELECT is(
  (SELECT telefone FROM public.profiles WHERE id = '0daaeea0-730c-4cef-b034-cce300160001'),
  '1234',
  'Signup retains the contact phone'
);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '0daaeea0-730c-4cef-b034-cce300160001';

SELECT results_eq(
  $$UPDATE public.profiles SET nome = 'RLS A edited'
    WHERE id = '0daaeea0-730c-4cef-b034-cce300160001' RETURNING nome$$,
  ARRAY['RLS A edited'::text],
  'An account can update its own display name'
);
SELECT is_empty(
  $$UPDATE public.profiles SET nome = 'Wrong account'
    WHERE id = '0daaeea0-730c-4cef-b034-cce300160002' RETURNING id$$,
  'An account cannot update another profile'
);
SELECT throws_ok(
  $$UPDATE public.profiles SET role = 'owner'
    WHERE id = '0daaeea0-730c-4cef-b034-cce300160001'$$,
  '42501', NULL, 'An account cannot promote its profile'
);
SELECT throws_ok(
  $$UPDATE public.profiles SET company_id = NULL
    WHERE id = '0daaeea0-730c-4cef-b034-cce300160001'$$,
  '42501', NULL, 'An account cannot rewrite its company binding'
);
SELECT throws_ok(
  $$INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES ('0daaeea0-730c-4cef-b034-cce300160003',
            '0daaeea0-730c-4cef-b034-cce300160001', 'owner')$$,
  '42501', NULL, 'An account cannot create an administrative membership'
);
SELECT throws_ok(
  $$UPDATE public.organization_members SET role = 'owner'$$,
  '42501', NULL, 'An account cannot promote an existing membership'
);
SELECT throws_ok(
  $$DELETE FROM public.organization_members
    WHERE user_id = '0daaeea0-730c-4cef-b034-cce300160001'$$,
  '42501', NULL, 'An account cannot delete a membership'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
