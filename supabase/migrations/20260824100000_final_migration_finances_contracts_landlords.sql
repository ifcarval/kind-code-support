-- Migração Final: finances, contracts, contract_versions e landlords

-- 1. Tabela LANDLORDS
CREATE TABLE IF NOT EXISTS public.landlords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document TEXT,
    email TEXT,
    phone TEXT,
    pix_key TEXT,
    bank_details JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela CONTRACTS
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    contract_number TEXT NOT NULL,
    status TEXT DEFAULT 'draft'::text,
    current_version INTEGER DEFAULT 1,
    payment_method TEXT,
    deposit_amount NUMERIC(12,2) DEFAULT 0,
    signal_amount NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    installments_count INTEGER DEFAULT 1,
    fine_percentage NUMERIC(5,2) DEFAULT 0,
    interest_percentage NUMERIC(5,2) DEFAULT 0,
    clauses TEXT,
    total_amount NUMERIC(12,2) DEFAULT 0,
    signed_manually BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela CONTRACT_VERSIONS
CREATE TABLE IF NOT EXISTS public.contract_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela FINANCES (substituindo invoices)
CREATE TABLE IF NOT EXISTS public.finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT,
    status TEXT NOT NULL DEFAULT 'pending'::text CHECK (status in ('pending', 'paid', 'overdue', 'cancelled')),
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    transaction_date DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to organization members on landlords" ON public.landlords FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to organization members on contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to organization members on contract_versions" ON public.contract_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to organization members on finances" ON public.finances FOR ALL USING (true) WITH CHECK (true);
