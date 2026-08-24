-- Fix search_path for security definer functions to prevent search path hijacking
alter function public.handle_new_user() set search_path = public;
alter function public.generate_monthly_invoices(uuid) set search_path = public;

-- Revoke public execution of security definer functions
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from authenticated;

revoke execute on function public.generate_monthly_invoices(uuid) from public;
-- authenticated users might need to run this manually as per requirements, 
-- but we should be careful. For now, restrict to service_role and authenticated.
-- Actually, the requirement says "Permitir execução manual por um botão no sistema".
-- So we keep execution for authenticated but revoke from public (anon).
revoke execute on function public.generate_monthly_invoices(uuid) from public;
