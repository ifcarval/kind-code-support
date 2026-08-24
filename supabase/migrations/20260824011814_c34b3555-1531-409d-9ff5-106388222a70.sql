
-- Enum para status de fatura
DO $$ BEGIN
    CREATE TYPE public.invoice_status AS ENUM ('rascunho', 'pendente', 'vencida', 'paga', 'cancelada', 'renegociada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum para formas de pagamento
DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('pix', 'boleto', 'cartão', 'transferência', 'dinheiro', 'outro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de faturas (invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_service_id UUID REFERENCES public.client_services(id) ON DELETE SET NULL,
    numero_fatura TEXT NOT NULL,
    competencia DATE NOT NULL,
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    descricao TEXT,
    valor_original NUMERIC(10,2) NOT NULL DEFAULT 0,
    desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
    multa NUMERIC(10,2) NOT NULL DEFAULT 0,
    juros NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_final NUMERIC(10,2) NOT NULL DEFAULT 0,
    status public.invoice_status NOT NULL DEFAULT 'pendente',
    forma_pagamento public.payment_method,
    comprovante_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, numero_fatura)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver suas próprias faturas"
ON public.invoices FOR SELECT TO authenticated
USING (company_id IN (SELECT id FROM public.companies));

CREATE POLICY "Empresas podem inserir faturas"
ON public.invoices FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT id FROM public.companies));

CREATE POLICY "Empresas podem atualizar faturas"
ON public.invoices FOR UPDATE TO authenticated
USING (company_id IN (SELECT id FROM public.companies));

-- Tabela de itens da fatura (invoice_items)
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
    valor_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver itens de suas faturas"
ON public.invoice_items FOR SELECT TO authenticated
USING (invoice_id IN (SELECT id FROM public.invoices));

CREATE POLICY "Empresas podem inserir itens em faturas"
ON public.invoice_items FOR INSERT TO authenticated
WITH CHECK (invoice_id IN (SELECT id FROM public.invoices));

-- Tabela de pagamentos (payments)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    valor_pago NUMERIC(10,2) NOT NULL DEFAULT 0,
    data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    forma_pagamento public.payment_method NOT NULL,
    referencia_pagamento TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver pagamentos"
ON public.payments FOR SELECT TO authenticated
USING (company_id IN (SELECT id FROM public.companies));

CREATE POLICY "Empresas podem inserir pagamentos"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT id FROM public.companies));

-- Função para atualizar o status da fatura automaticamente
CREATE OR REPLACE FUNCTION public.update_invoice_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_pago NUMERIC;
    fatura_valor_final NUMERIC;
    fatura_vencimento DATE;
BEGIN
    -- Obter o valor final da fatura e data de vencimento
    SELECT valor_final, data_vencimento INTO fatura_valor_final, fatura_vencimento
    FROM public.invoices
    WHERE id = NEW.invoice_id;

    -- Calcular soma de todos os pagamentos para esta fatura
    SELECT COALESCE(SUM(valor_pago), 0) INTO total_pago
    FROM public.payments
    WHERE invoice_id = NEW.invoice_id;

    -- Atualizar status com base no valor pago
    IF total_pago >= fatura_valor_final THEN
        UPDATE public.invoices 
        SET status = 'paga', data_pagamento = NEW.data_pagamento 
        WHERE id = NEW.invoice_id;
    ELSIF total_pago > 0 THEN
        UPDATE public.invoices 
        SET status = 'pendente' 
        WHERE id = NEW.invoice_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger para atualizar status após um pagamento
CREATE TRIGGER after_payment_insert
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_status();

-- Função para gerar faturas mensais automaticamente
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
BEGIN
    FOR rec IN 
        SELECT cs.*, c.name as client_name
        FROM public.client_services cs
        JOIN public.clients c ON cs.client_id = c.id
        WHERE cs.ativo = true
    LOOP
        -- Evitar duplicidade para o mesmo serviço e competência
        IF NOT EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE client_service_id = rec.id 
            AND competencia = date_trunc('month', _target_month)::date
        ) THEN
            -- Gerar número único simples: ANO-MES-ID_CURTO
            v_numero_fatura := to_char(_target_month, 'YYYY-MM') || '-' || upper(left(rec.id::text, 8));
            
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
                (date_trunc('month', _target_month) + interval '1 month - 1 day')::date, -- Vencimento no último dia do mês
                'Serviço recorrente: ' || rec.client_name,
                rec.valor_customizado,
                rec.valor_customizado,
                'pendente'
            );
            
            count := count + 1;
        END IF;
    END LOOP;
    
    RETURN count;
END;
$$;

REVOKE ALL ON FUNCTION public.update_invoice_status() FROM public;
REVOKE ALL ON FUNCTION public.generate_monthly_invoices(DATE) FROM public;
GRANT EXECUTE ON FUNCTION public.update_invoice_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_monthly_invoices(DATE) TO authenticated, service_role;
