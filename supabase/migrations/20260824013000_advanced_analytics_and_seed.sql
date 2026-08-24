-- Advanced Analytics Views

-- 1. Monthly Revenue History (Last 12 months)
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
        date_trunc('month', i.due_date) as month,
        SUM(i.total_amount) as projected,
        SUM(i.paid_amount) as received
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

-- 2. Billing Status Distribution
CREATE OR REPLACE VIEW public.billing_status_distribution WITH (security_invoker = true) AS
SELECT 
    company_id,
    status,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM public.invoices
GROUP BY company_id, status;

-- 3. Top Clients by Revenue
CREATE OR REPLACE VIEW public.top_clients_revenue WITH (security_invoker = true) AS
SELECT 
    i.company_id,
    c.name as client_name,
    COUNT(i.id) as invoice_count,
    SUM(i.total_amount) as total_projected,
    SUM(i.paid_amount) as total_received
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
GROUP BY i.company_id, c.name
ORDER BY total_projected DESC;

-- 4. Profitable Services
CREATE OR REPLACE VIEW public.profitable_services WITH (security_invoker = true) AS
SELECT 
    s.company_id,
    s.name as service_name,
    COUNT(cs.id) as active_contracts,
    SUM(cs.price) as monthly_revenue
FROM public.services s
JOIN public.client_services cs ON s.id = cs.service_id
WHERE cs.status = 'active'
GROUP BY s.company_id, s.name
ORDER BY monthly_revenue DESC;

-- 5. Delinquent Clients (Inadimplentes)
CREATE OR REPLACE VIEW public.delinquent_clients WITH (security_invoker = true) AS
SELECT 
    c.company_id,
    c.name as client_name,
    COUNT(i.id) as overdue_count,
    SUM(i.total_amount - i.paid_amount) as total_overdue
FROM public.clients c
JOIN public.invoices i ON c.id = i.client_id
WHERE i.status = 'overdue'
GROUP BY c.company_id, c.name
HAVING COUNT(i.id) > 0;

-- 6. Advanced Stats (Ticket Médio, Delinquency Rate)
CREATE OR REPLACE VIEW public.advanced_dashboard_stats WITH (security_invoker = true) AS
SELECT 
    c.id as company_id,
    (SELECT COUNT(*) FROM public.clients WHERE company_id = c.id) as total_clients,
    (SELECT COUNT(*) FROM public.services WHERE company_id = c.id) as total_services,
    (SELECT COALESCE(AVG(total_amount), 0) FROM public.invoices WHERE company_id = c.id) as average_ticket,
    (
        SELECT COALESCE(
            (COUNT(CASE WHEN status = 'overdue' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100),
            0
        )
        FROM public.invoices
        WHERE company_id = c.id
    ) as delinquency_rate,
    (
        SELECT SUM(total_amount - paid_amount)
        FROM public.invoices
        WHERE company_id = c.id AND status = 'overdue'
    ) as total_overdue_amount
FROM public.companies c;

-- 7. Upcoming Due Dates
CREATE OR REPLACE VIEW public.upcoming_due_dates WITH (security_invoker = true) AS
SELECT 
    i.company_id,
    c.name as client_name,
    i.due_date,
    i.total_amount,
    i.status,
    (i.due_date - current_date) as days_until
FROM public.invoices i
JOIN public.clients c ON i.client_id = c.id
WHERE i.status = 'pending' 
  AND i.due_date >= current_date 
  AND i.due_date <= current_date + interval '30 days';

-- Demo Data Expansion
DO $$
DECLARE
    v_company_id UUID;
    v_client_id UUID;
    v_service_id UUID;
    v_invoice_id UUID;
    i INTEGER;
    j INTEGER;
    v_month_start DATE;
BEGIN
    -- Get the first company
    SELECT id INTO v_company_id FROM public.companies LIMIT 1;
    
    IF v_company_id IS NOT NULL THEN
        -- Create more services (Total 8)
        FOR i IN 1..8 LOOP
            INSERT INTO public.services (company_id, name, description, price, billing_cycle)
            VALUES (v_company_id, 'Serviço Premium ' || i, 'Descrição do serviço ' || i, 150.00 * i, 'monthly')
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- Ensure 10 clients
        FOR i IN 1..10 LOOP
            INSERT INTO public.clients (company_id, name, email, document, phone)
            VALUES (v_company_id, 'Cliente Fictício ' || i, 'cliente' || i || '@exemplo.com', '1234567890' || i, '119999999' || i)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- Link services to clients
        FOR v_client_id IN (SELECT id FROM public.clients WHERE company_id = v_company_id) LOOP
            FOR v_service_id IN (SELECT id FROM public.services WHERE company_id = v_company_id ORDER BY random() LIMIT 2) LOOP
                INSERT INTO public.client_services (client_id, service_id, price, status, next_billing_date)
                VALUES (v_client_id, v_service_id, (SELECT price FROM public.services WHERE id = v_service_id), 'active', now() + interval '1 month')
                ON CONFLICT DO NOTHING;
            END LOOP;
        END LOOP;

        -- Generate 12 months of history
        FOR i IN 0..11 LOOP
            v_month_start := date_trunc('month', now()) - (i || ' months')::interval;
            
            FOR v_client_id IN (SELECT id FROM public.clients WHERE company_id = v_company_id) LOOP
                -- Create invoice
                INSERT INTO public.invoices (company_id, client_id, number, issue_date, due_date, status, total_amount, paid_amount)
                VALUES (
                    v_company_id, 
                    v_client_id, 
                    'DEMO-' || to_char(v_month_start, 'YYYYMM') || '-' || v_client_id,
                    v_month_start,
                    v_month_start + interval '10 days',
                    CASE 
                        WHEN i = 0 THEN 'pending' -- Current month
                        WHEN random() > 0.2 THEN 'paid' 
                        ELSE 'overdue' 
                    END,
                    250.00,
                    0
                ) RETURNING id INTO v_invoice_id;

                -- Update paid amount if status is paid
                UPDATE public.invoices 
                SET paid_amount = total_amount 
                WHERE id = v_invoice_id AND status = 'paid';

                -- Add items to invoice
                INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total_price)
                SELECT v_invoice_id, s.name, 1, cs.price, cs.price
                FROM public.client_services cs
                JOIN public.services s ON cs.service_id = s.id
                WHERE cs.client_id = v_client_id;
                
                -- Record payment for paid invoices
                INSERT INTO public.payments (invoice_id, amount, payment_date, payment_method)
                SELECT v_invoice_id, total_amount, due_date, 'transferencia'
                FROM public.invoices
                WHERE id = v_invoice_id AND status = 'paid';
            END LOOP;
        END LOOP;
    END IF;
END $$;
