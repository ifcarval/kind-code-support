BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path TO public, extensions;
SELECT plan(5);

INSERT INTO auth.users (id, email) VALUES
  ('fe88bf3d-4884-4791-a361-e851fe060001', 'owner-policy@example.test'),
  ('fe88bf3d-4884-4791-a361-e851fe060002', 'customer-policy@example.test');

INSERT INTO public.organizations (id, name) VALUES
  ('fe88bf3d-4884-4791-a361-e851fe060003', 'Policy A'),
  ('fe88bf3d-4884-4791-a361-e851fe060004', 'Policy B');

INSERT INTO public.organization_members (organization_id, user_id, role) VALUES
  ('fe88bf3d-4884-4791-a361-e851fe060003', 'fe88bf3d-4884-4791-a361-e851fe060001', 'owner'),
  ('fe88bf3d-4884-4791-a361-e851fe060003', 'fe88bf3d-4884-4791-a361-e851fe060002', 'member');

INSERT INTO public.contract_templates (organization_id, name) VALUES
  ('fe88bf3d-4884-4791-a361-e851fe060003', 'Policy A template'),
  ('fe88bf3d-4884-4791-a361-e851fe060004', 'Policy B template');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'fe88bf3d-4884-4791-a361-e851fe060001';
SELECT results_eq(
  $$SELECT name FROM public.contract_templates WHERE name LIKE 'Policy % template' ORDER BY name$$,
  ARRAY['Policy A template'::text],
  'Owner only sees templates from their organization'
);
SELECT throws_ok(
  $$INSERT INTO public.contract_templates (organization_id, name)
    VALUES ('fe88bf3d-4884-4791-a361-e851fe060004', 'Cross-organization template')$$,
  '42501', NULL, 'Owner cannot insert a template into another organization'
);

SET LOCAL request.jwt.claim.sub = 'fe88bf3d-4884-4791-a361-e851fe060002';
SELECT is_empty(
  $$SELECT name FROM public.contract_templates WHERE name LIKE 'Policy % template'$$,
  'Regular members cannot read organization templates'
);
SELECT throws_ok(
  $$INSERT INTO public.contract_templates (organization_id, name)
    VALUES ('fe88bf3d-4884-4791-a361-e851fe060003', 'Member template')$$,
  '42501', NULL, 'Regular members cannot create templates in their organization'
);

RESET ROLE;
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claim.sub = '';
SELECT throws_ok(
  $$SELECT id FROM public.contracts LIMIT 1$$,
  '42501', NULL, 'Anonymous visitors cannot query private contracts'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
