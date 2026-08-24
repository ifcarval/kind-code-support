-- Revoke execution from functions identified by linter
REVOKE EXECUTE ON FUNCTION public.generate_monthly_invoices(uuid) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_monthly_invoices(date) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_invoice_status() FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, authenticated;

GRANT EXECUTE ON FUNCTION public.generate_monthly_invoices(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_monthly_invoices(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_invoice_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- The views were already created with security_invoker = true, so no changes needed there.