-- Fix all views to be security_invoker
ALTER VIEW public.monthly_billing_history SET (security_invoker = true);
ALTER VIEW public.dashboard_stats SET (security_invoker = true);
ALTER VIEW public.monthly_revenue_history SET (security_invoker = true);
ALTER VIEW public.billing_status_distribution SET (security_invoker = true);
ALTER VIEW public.top_clients_revenue SET (security_invoker = true);
ALTER VIEW public.profitable_services SET (security_invoker = true);
ALTER VIEW public.delinquent_clients SET (security_invoker = true);
ALTER VIEW public.advanced_dashboard_stats SET (security_invoker = true);
ALTER VIEW public.upcoming_due_dates SET (security_invoker = true);

-- Revoke execution on handle_updated_at and any others
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;