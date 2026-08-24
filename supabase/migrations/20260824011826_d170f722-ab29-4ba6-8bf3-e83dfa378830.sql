
-- Revogar execução pública de funções críticas
REVOKE EXECUTE ON FUNCTION public.update_invoice_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_monthly_invoices(DATE) FROM PUBLIC;

-- Conceder permissão apenas para service_role (trigger)
GRANT EXECUTE ON FUNCTION public.update_invoice_status() TO service_role;

-- Conceder permissão para authenticated e service_role para geração de faturas
GRANT EXECUTE ON FUNCTION public.generate_monthly_invoices(DATE) TO authenticated, service_role;
