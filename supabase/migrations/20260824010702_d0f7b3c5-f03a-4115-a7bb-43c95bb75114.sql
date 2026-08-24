-- Fix search_path for handle_updated_at
alter function public.handle_updated_at() set search_path = public;

-- Revoke execute from public on all security definer functions to be safe
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.generate_monthly_invoices(uuid) from public;

-- Ensure handle_updated_at is also restricted if it was flagged (it's security invoker by default, but linter might be picky)
-- Actually, linter flagged security definer ones.
