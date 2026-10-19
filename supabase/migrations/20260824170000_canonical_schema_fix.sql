-- Migração oficial e canônica para Salão Santa Felicidade

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir organização padrão 'Salão Santa Felicidade' se não existir
INSERT INTO public.organizations (name)
SELECT 'Salão Santa Felicidade'
WHERE NOT EXISTS (
    SELECT 1 FROM public.organizations WHERE name = 'Salão Santa Felicidade'
);

-- 3. ORGANIZATION_MEMBERS
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT organization_members_org_user_key UNIQUE (organization_id, user_id)
);

-- 4. LANDLORDS
CREATE TABLE IF NOT EXISTS public.landlords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_document ON public.customers(document);
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- 6. EVENT_TYPES
CREATE TABLE IF NOT EXISTS public.event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    seed_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_types_category ON public.event_types(category);
CREATE INDEX IF NOT EXISTS idx_event_types_sort ON public.event_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_event_types_active ON public.event_types(is_active);

-- 7. EVENTS (Garantido e verificado com FKs válidas e constraints robustas)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    event_type_id UUID REFERENCES public.event_types(id) ON DELETE SET NULL,
    custom_event_type TEXT,
    title TEXT NOT NULL,
    event_type TEXT,
    status TEXT NOT NULL DEFAULT 'RESERVED',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    guests INTEGER NOT NULL DEFAULT 0,
    total_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    signal_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT events_guests_check CHECK (guests >= 0),
    CONSTRAINT events_total_value_check CHECK (total_value >= 0),
    CONSTRAINT events_signal_value_check CHECK (signal_value >= 0 AND signal_value <= total_value),
    CONSTRAINT events_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_events_customer_id ON public.events(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type_id ON public.events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- 8. CONTRACTS
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    landlord_id UUID REFERENCES public.landlords(id) ON DELETE SET NULL,
    contract_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Rascunho',
    current_version INTEGER NOT NULL DEFAULT 1,
    is_customer_visible BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_org_number ON public.contracts(organization_id, contract_number);

-- 9. CONTRACT_VERSIONS
CREATE TABLE IF NOT EXISTS public.contract_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    landlord_name TEXT,
    landlord_document TEXT,
    landlord_phone TEXT,
    landlord_email TEXT,
    landlord_address TEXT,
    tenant_name TEXT,
    tenant_document TEXT,
    tenant_phone TEXT,
    tenant_email TEXT,
    tenant_address TEXT,
    event_title TEXT,
    event_type TEXT,
    event_start_date DATE,
    event_end_date DATE,
    event_start_time TIME,
    event_end_time TIME,
    event_guests INTEGER,
    event_notes TEXT,
    total_value NUMERIC(12,2) DEFAULT 0,
    deposit_value NUMERIC(12,2) DEFAULT 0,
    discount_value NUMERIC(12,2) DEFAULT 0,
    signal_value NUMERIC(12,2) DEFAULT 0,
    installments INTEGER DEFAULT 1,
    payment_method TEXT,
    fine TEXT,
    interest TEXT,
    signal_due_date DATE,
    additional_clauses TEXT,
    contract_text TEXT,
    signature_status TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT contract_versions_unique_version UNIQUE (contract_id, version)
);

-- 10. FINANCES
CREATE TABLE IF NOT EXISTS public.finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
    category TEXT NOT NULL CHECK (category IN ('parcela', 'sinal', 'caucao', 'despesa')),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('realizado', 'pendente')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT CHECK (payment_method IN ('Cartão de crédito', 'Cartão de débito', 'Pix', 'Dinheiro', 'Cheque')),
    transaction_date DATE,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT finances_type_category_check CHECK (
        (type = 'saida' AND category = 'despesa') OR
        (type = 'entrada' AND category != 'despesa')
    )
);

-- 11. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['profiles', 'organizations', 'landlords', 'customers', 'event_types', 'events', 'contracts', 'finances']) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS handle_updated_at ON public.%I;', tbl);
        EXECUTE format('CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', tbl);
    END LOOP;
END;
$$
;

-- 12. HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permissivas para o painel administrativo autenticado e master
CREATE POLICY "Allow authenticated access on profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on organizations" ON public.organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on organization_members" ON public.organization_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on landlords" ON public.landlords FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on event_types" ON public.event_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on contracts" ON public.contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on contract_versions" ON public.contract_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access on finances" ON public.finances FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. SEED DE EVENT_TYPES
INSERT INTO public.event_types (name, category, is_active, sort_order, seed_key)
VALUES
('Aniversário adulto', 'Festas sociais', true, 10, 'festas_aniversario_adulto'),
('Casamento', 'Festas sociais', true, 20, 'festas_casamento'),
('Festa infantil', 'Festas sociais', true, 30, 'festas_infantil'),
('Confraternização de empresa', 'Eventos empresariais', true, 10, 'empresariais_confra'),
('Reunião ou Workshop', 'Eventos empresariais', true, 20, 'empresariais_workshop'),
('Culto ou celebração religiosa', 'Eventos religiosos', true, 10, 'religiosos_culto'),
('Outro', 'Diversos', true, 99, 'diversos_outro')
ON CONFLICT DO NOTHING;
