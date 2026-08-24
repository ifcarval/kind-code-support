
-- Recriar views como views simples (invocador) para respeitar RLS (implícito se baseadas em tabelas com RLS)
DROP VIEW IF EXISTS public.dashboard_stats;
CREATE VIEW public.dashboard_stats AS
SELECT 
    c.id as company_id,
    (SELECT count(*) FROM public.clients cl WHERE cl.company_id = c.id AND cl.status = 'ativo') as active_clients,
    (SELECT count(*) FROM public.client_services cs WHERE cs.company_id = c.id AND cs.status = 'ativo') as active_services,
    (SELECT COALESCE(sum(valor_final), 0) FROM public.invoices i 
     WHERE i.company_id = c.id 
     AND i.competencia = date_trunc('month', now())::date) as monthly_revenue_projected,
    (SELECT COALESCE(sum(valor_final), 0) FROM public.invoices i 
     WHERE i.company_id = c.id 
     AND i.status = 'paga' 
     AND i.competencia = date_trunc('month', now())::date) as monthly_revenue_received
FROM public.companies c;

GRANT SELECT ON public.dashboard_stats TO authenticated;

DROP VIEW IF EXISTS public.monthly_billing_history;
CREATE VIEW public.monthly_billing_history AS
SELECT 
    company_id,
    competencia,
    sum(valor_final) as total_projected,
    sum(CASE WHEN status = 'paga' THEN valor_final ELSE 0 END) as total_paid,
    count(*) as invoice_count
FROM public.invoices
GROUP BY company_id, competencia;

GRANT SELECT ON public.monthly_billing_history TO authenticated;

-- Garantir que a função generate_monthly_invoices não seja acessível publicamente
REVOKE EXECUTE ON FUNCTION public.generate_monthly_invoices(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_monthly_invoices(DATE) TO authenticated, service_role;
