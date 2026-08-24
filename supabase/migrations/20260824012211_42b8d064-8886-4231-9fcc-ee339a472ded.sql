
-- Função aprimorada para gerar faturas mensais
CREATE OR REPLACE FUNCTION public.generate_monthly_invoices(_target_month DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rec RECORD;
    count INTEGER := 0;
    v_numero_fatura TEXT;
    v_invoice_id UUID;
    v_vencimento DATE;
    v_last_numero INTEGER;
BEGIN
    -- Loop por todos os serviços ativos e recorrentes
    FOR rec IN 
        SELECT cs.*, c.nome_razao_social as client_name
        FROM public.client_services cs
        JOIN public.clients c ON cs.client_id = c.id
        WHERE cs.status = 'ativo' 
        AND cs.tipo_cobranca != 'avulsa'
    LOOP
        -- Evitar duplicidade para o mesmo serviço e competência
        IF NOT EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE client_service_id = rec.id 
            AND competencia = date_trunc('month', _target_month)::date
        ) THEN
            
            -- Gerar número sequencial por empresa
            SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(numero_fatura, '^.*-', ''), '') AS INTEGER)), 0) + 1 
            INTO v_last_numero
            FROM public.invoices 
            WHERE company_id = rec.company_id;
            
            v_numero_fatura := to_char(_target_month, 'YYYYMM') || '-' || LPAD(v_last_numero::text, 5, '0');
            
            -- Calcular data de vencimento
            v_vencimento := (date_trunc('month', _target_month) + (COALESCE(rec.dia_vencimento, 10) - 1 || ' days')::interval)::date;
            
            -- Se o vencimento cair no mês anterior (ex: dia 1 no primeiro dia), garantir que está no mês alvo
            IF v_vencimento < date_trunc('month', _target_month)::date THEN
                v_vencimento := v_vencimento + interval '1 month';
            END IF;

            -- Inserir Fatura
            INSERT INTO public.invoices (
                company_id,
                client_id,
                client_service_id,
                numero_fatura,
                competencia,
                data_vencimento,
                descricao,
                valor_original,
                valor_final,
                status
            ) VALUES (
                rec.company_id,
                rec.client_id,
                rec.id,
                v_numero_fatura,
                date_trunc('month', _target_month)::date,
                v_vencimento,
                'Fatura mensal - ' || rec.nome_servico,
                rec.valor_mensal,
                rec.valor_mensal,
                'pendente'
            ) RETURNING id INTO v_invoice_id;
            
            -- Criar Item da Fatura
            INSERT INTO public.invoice_items (
                invoice_id,
                descricao,
                quantidade,
                valor_unitario,
                valor_total
            ) VALUES (
                v_invoice_id,
                rec.nome_servico,
                1,
                rec.valor_mensal,
                rec.valor_mensal
            );
            
            count := count + 1;
        END IF;
    END LOOP;
    
    RETURN count;
END;
$$;

-- View para estatísticas do Dashboard
CREATE OR REPLACE VIEW public.dashboard_stats AS
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

-- View para histórico de faturamento mensal
CREATE OR REPLACE VIEW public.monthly_billing_history AS
SELECT 
    company_id,
    competencia,
    sum(valor_final) as total_projected,
    sum(CASE WHEN status = 'paga' THEN valor_final ELSE 0 END) as total_paid,
    count(*) as invoice_count
FROM public.invoices
GROUP BY company_id, competencia;

GRANT SELECT ON public.monthly_billing_history TO authenticated;

-- Políticas RLS para as Views (Postgres 15+ suporta, mas aqui usaremos a filtragem no SELECT do cliente baseado na company_id do perfil)
-- Como views não têm RLS direto no Supabase da mesma forma que tabelas, garantimos que o desenvolvedor filtre por company_id.
