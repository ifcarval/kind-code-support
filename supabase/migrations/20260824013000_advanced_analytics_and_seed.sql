-- 1. Add Unique Constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_company_id_nome_key') THEN
        ALTER TABLE public.services ADD CONSTRAINT services_company_id_nome_key UNIQUE (company_id, nome);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_company_id_cpf_cnpj_key') THEN
        ALTER TABLE public.clients ADD CONSTRAINT clients_company_id_cpf_cnpj_key UNIQUE (company_id, cpf_cnpj);
    END IF;
END $$;

-- 2. Advanced Analytics Views
CREATE OR REPLACE VIEW public.monthly_revenue_history WITH (security_invoker = true) AS
WITH months AS (
    SELECT date_trunc('month', generate_series(
        date_trunc('month', now()) - interval '11 months',
        date_trunc('month', now()),
        interval '1 month'
    )) as month
),
company_months AS (
    SELECT c.id as company_id, m.month
    FROM public.companies c
    CROSS JOIN months m
),
revenue AS (
    SELECT 
        i.company_id,
        date_trunc('month', i.data_vencimento) as month,
        SUM(i.valor_final) as projected,
        SUM(CASE WHEN i.status = 'paga' THEN i.valor_final ELSE 0 END) as received
    FROM public.invoices i
    GROUP BY 1, 2
)
SELECT 
    cm.company_id,
    cm.month,
    COALESCE(r.projected, 0) as projected,
    COALESCE(r.received, 0) as received
FROM company_months cm
LEFT JOIN revenue r ON cm.company_id = r.company_id AND cm.month = r.month;

CREATE OR REPLACE VIEW public.billing_status_distribution WITH (security_invoker = true) AS
SELECT 
    company_id,
    status,
    COUNT(*) as count,
    SUM(valor_final) as total_amount
FROM public.invoices
GROUP BY company_id, status;

CREATE OR REPLACE VIEW public.top_clients_revenue WITH (security_invoker = true) AS
SELECT 
    i.company_id,
    c.nome_razao_social as client_name,
    COUNT(i.id) as invoice_count,
    SUM(i.valor_final) as total_projected,
    SUM(CASE WHEN i.status = 'paga' THEN i.valor_final ELSE 0 END) as total_received
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
GROUP BY i.company_id, c.nome_razao_social
ORDER BY total_projected DESC;

CREATE OR REPLACE VIEW public.profitable_services WITH (security_invoker = true) AS
SELECT 
    s.company_id,
    s.nome as service_name,
    COUNT(cs.id) as active_contracts,
    SUM(cs.valor_mensal) as monthly_revenue
FROM public.services s
JOIN public.client_services cs ON s.id = cs.service_id
WHERE cs.status = 'ativo'
GROUP BY s.company_id, s.nome
ORDER BY monthly_revenue DESC;

CREATE OR REPLACE VIEW public.delinquent_clients WITH (security_invoker = true) AS
SELECT 
    c.company_id,
    c.nome_razao_social as client_name,
    COUNT(i.id) as overdue_count,
    SUM(i.valor_final) as total_overdue
FROM public.clients c
JOIN public.invoices i ON c.id = i.client_id
WHERE i.status = 'vencida'
GROUP BY c.company_id, c.nome_razao_social
HAVING COUNT(i.id) > 0;

CREATE OR REPLACE VIEW public.advanced_dashboard_stats WITH (security_invoker = true) AS
SELECT 
    c.id as company_id,
    (SELECT COUNT(*) FROM public.clients WHERE company_id = c.id) as total_clients,
    (SELECT COUNT(*) FROM public.services WHERE company_id = c.id) as total_services,
    (SELECT COALESCE(AVG(valor_final), 0) FROM public.invoices WHERE company_id = c.id) as average_ticket,
    (
        SELECT COALESCE(
            (COUNT(CASE WHEN status = 'vencida' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100),
            0
        )
        FROM public.invoices
        WHERE company_id = c.id
    ) as delinquency_rate,
    (
        SELECT SUM(valor_final)
        FROM public.invoices
        WHERE company_id = c.id AND status = 'vencida'
    ) as total_overdue_amount
FROM public.companies c;

CREATE OR REPLACE VIEW public.upcoming_due_dates WITH (security_invoker = true) AS
SELECT 
    i.company_id,
    c.nome_razao_social as client_name,
    i.data_vencimento,
    i.valor_final,
    i.status,
    (i.data_vencimento - current_date) as days_until
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
WHERE i.status = 'pendente' 
  AND i.data_vencimento >= current_date 
  AND i.data_vencimento <= current_date + interval '30 days';

-- 3. Demo Data Expansion
DO 25165
DECLARE
    v_company_id UUID;
    v_client_id UUID;
    v_service_id UUID;
    v_invoice_id UUID;
    v_service_name TEXT;
    i INTEGER;
    v_month_start DATE;
BEGIN
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    IF v_company_id IS NOT NULL THEN
        FOR i IN 1..8 LOOP
            INSERT INTO public.services (company_id, nome, descricao, valor_padrao, recorrente, ativo)
            VALUES (v_company_id, 'Serviço Premium ' || i, 'Descrição do serviço ' || i, 150.00 * i, true, true)
            ON CONFLICT (company_id, nome) DO NOTHING;
        END LOOP;

        FOR i IN 1..10 LOOP
            INSERT INTO public.clients (company_id, nome_razao_social, email, cpf_cnpj, telefone)
            VALUES (v_company_id, 'Cliente Fictício ' || i, 'cliente' || i || '@exemplo.com', '1234567890' || i, '119999999' || i)
            ON CONFLICT (company_id, cpf_cnpj) DO NOTHING;
        END LOOP;

        FOR v_client_id IN (SELECT id FROM public.clients WHERE company_id = v_company_id) LOOP
            FOR v_service_id, v_service_name IN (SELECT id, nome FROM public.services WHERE company_id = v_company_id ORDER BY random() LIMIT 2) LOOP
                INSERT INTO public.client_services (company_id, client_id, service_id, nome_servico, valor_mensal, status, data_inicio)
                VALUES (v_company_id, v_client_id, v_service_id, v_service_name, (SELECT valor_padrao FROM public.services WHERE id = v_service_id), 'ativo', now())
                ON CONFLICT DO NOTHING;
            END LOOP;
        END LOOP;

        FOR i IN 0..11 LOOP
            v_month_start := (date_trunc('month', now()) - (i || ' months')::interval)::date;
            
            FOR v_client_id IN (SELECT id FROM public.clients WHERE company_id = v_company_id) LOOP
                INSERT INTO public.invoices (
                    company_id, client_id, numero_fatura, data_emissao, data_vencimento, status, valor_original, valor_final, competencia
                )
                VALUES (
                    v_company_id, v_client_id, 'DEMO-' || to_char(v_month_start, 'YYYYMM') || '-' || substring(v_client_id::text, 1, 4),
                    v_month_start, v_month_start + interval '10 days',
                    CASE WHEN i = 0 THEN 'pendente'::public.invoice_status WHEN random() > 0.2 THEN 'paga'::public.invoice_status ELSE 'vencida'::public.invoice_status END,
                    250.00, 250.00, v_month_start
                ) ON CONFLICT (numero_fatura) DO NOTHING
                RETURNING id INTO v_invoice_id;

                IF v_invoice_id IS NOT NULL THEN
                    INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total_price)
                    SELECT v_invoice_id, s.nome, 1, cs.valor_mensal, cs.valor_mensal
                    FROM public.client_services cs
                    JOIN public.services s ON cs.service_id = s.id
                    WHERE cs.client_id = v_client_id;
                    
                    INSERT INTO public.payments (company_id, invoice_id, valor_pago, data_pagamento, forma_pagamento)
                    SELECT v_company_id, v_invoice_id, 250.00, v_month_start + interval '10 days', 'transferencia'::public.payment_method
                    FROM public.invoices
                    WHERE id = v_invoice_id AND status = 'paga';
                END IF;
            END LOOP;
        END LOOP;
    END IF;
END 25165;
