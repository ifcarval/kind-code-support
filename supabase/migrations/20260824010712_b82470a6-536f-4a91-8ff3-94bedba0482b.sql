-- Revoke all privileges from public (anon) on the security definer functions
revoke all on function public.handle_new_user() from public;
revoke all on function public.generate_monthly_invoices(uuid) from public;

-- Also authenticated for handle_new_user as it should only be called by trigger
revoke all on function public.handle_new_user() from authenticated;
