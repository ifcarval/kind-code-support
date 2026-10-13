-- Migração para Constraints, Índices, Trigger de updated_at e RLS para as tabelas do novo sistema
-- Tabelas afetadas: profiles, organizations, organization_members, landlords, customers, events, contracts, contract_versions, finances

-- 1. TRIGGER FUNCTION PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TRIGGERS DE UPDATED_AT
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_landlords_updated_at ON public.landlords;
CREATE TRIGGER update_landlords_updated_at
    BEFORE UPDATE ON public.landlords
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_versions_updated_at ON public.contract_versions;
CREATE TRIGGER update_contract_versions_updated_at
    BEFORE UPDATE ON public.contract_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_finances_updated_at ON public.finances;
CREATE TRIGGER update_finances_updated_at
    BEFORE UPDATE ON public.finances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();


-- 3. ÍNDICES DE DESEMPENHO E ESTRUTURA
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_landlords_org_id ON public.landlords(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(organization_id);

CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON public.contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON public.contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_landlord_id ON public.contracts(landlord_id);

CREATE INDEX IF NOT EXISTS idx_contract_versions_contract_id ON public.contract_versions(contract_id);

CREATE INDEX IF NOT EXISTS idx_finances_org_id ON public.finances(organization_id);
CREATE INDEX IF NOT EXISTS idx_finances_contract_id ON public.finances(contract_id);


-- 4. FUNÇÃO AUXILIAR DE SEGURANÇA PARA VERIFICAR PERTENCIMENTO À ORGANIZAÇÃO
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE user_id = _user_id
          AND organization_id = _organization_id
    );
$$;


-- 5. ROW LEVEL SECURITY (RLS) E POLÍTICAS

-- Garante RLS ativado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;


-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile or org member profiles" ON public.profiles;
CREATE POLICY "Users can view own profile or org member profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.organization_members om1
            JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id
        )
    );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE TO authenticated
    USING (id = auth.uid());


-- ORGANIZATIONS POLICIES
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
CREATE POLICY "Members can view their organizations" ON public.organizations
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), id));

DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;
CREATE POLICY "Authenticated users can insert organizations" ON public.organizations
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Org owners/admins can update organizations" ON public.organizations;
CREATE POLICY "Org owners/admins can update organizations" ON public.organizations
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), id))
    WITH CHECK (public.user_belongs_to_org(auth.uid(), id));

DROP POLICY IF EXISTS "Org owners can delete organizations" ON public.organizations;
CREATE POLICY "Org owners can delete organizations" ON public.organizations
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE user_id = auth.uid()
              AND organization_id = organizations.id
              AND role = 'owner'
        )
    );


-- ORGANIZATION_MEMBERS POLICIES
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
CREATE POLICY "Members can view organization members" ON public.organization_members
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org owners/admins can insert members" ON public.organization_members;
CREATE POLICY "Org owners/admins can insert members" ON public.organization_members
    FOR INSERT TO authenticated
    WITH CHECK (
        public.user_belongs_to_org(auth.uid(), organization_id)
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Org owners/admins can update members" ON public.organization_members;
CREATE POLICY "Org owners/admins can update members" ON public.organization_members
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id))
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org owners/admins can delete members" ON public.organization_members;
CREATE POLICY "Org owners/admins can delete members" ON public.organization_members
    FOR DELETE TO authenticated
    USING (
        public.user_belongs_to_org(auth.uid(), organization_id)
        OR user_id = auth.uid()
    );


-- LANDLORDS POLICIES
DROP POLICY IF EXISTS "Org members can view landlords" ON public.landlords;
CREATE POLICY "Org members can view landlords" ON public.landlords
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can insert landlords" ON public.landlords;
CREATE POLICY "Org members can insert landlords" ON public.landlords
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can update landlords" ON public.landlords;
CREATE POLICY "Org members can update landlords" ON public.landlords
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id))
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can delete landlords" ON public.landlords;
CREATE POLICY "Org members can delete landlords" ON public.landlords
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));


-- CUSTOMERS POLICIES
DROP POLICY IF EXISTS "Org members can view customers" ON public.customers;
CREATE POLICY "Org members can view customers" ON public.customers
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can insert customers" ON public.customers;
CREATE POLICY "Org members can insert customers" ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can update customers" ON public.customers;
CREATE POLICY "Org members can update customers" ON public.customers
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id))
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can delete customers" ON public.customers;
CREATE POLICY "Org members can delete customers" ON public.customers
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));


-- EVENTS POLICIES
DROP POLICY IF EXISTS "Org members can view events" ON public.events;
CREATE POLICY "Org members can view events" ON public.events
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can insert events" ON public.events;
CREATE POLICY "Org members can insert events" ON public.events
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can update events" ON public.events;
CREATE POLICY "Org members can update events" ON public.events
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id))
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can delete events" ON public.events;
CREATE POLICY "Org members can delete events" ON public.events
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));


-- CONTRACTS POLICIES
DROP POLICY IF EXISTS "Org members can view contracts" ON public.contracts;
CREATE POLICY "Org members can view contracts" ON public.contracts
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can insert contracts" ON public.contracts;
CREATE POLICY "Org members can insert contracts" ON public.contracts
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can update contracts" ON public.contracts;
CREATE POLICY "Org members can update contracts" ON public.contracts
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id))
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can delete contracts" ON public.contracts;
CREATE POLICY "Org members can delete contracts" ON public.contracts
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));


-- CONTRACT_VERSIONS POLICIES (herda verificação via contrato associado)
DROP POLICY IF EXISTS "Org members can view contract_versions" ON public.contract_versions;
CREATE POLICY "Org members can view contract_versions" ON public.contract_versions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.id = contract_versions.contract_id
              AND public.user_belongs_to_org(auth.uid(), c.organization_id)
        )
    );

DROP POLICY IF EXISTS "Org members can insert contract_versions" ON public.contract_versions;
CREATE POLICY "Org members can insert contract_versions" ON public.contract_versions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.id = contract_versions.contract_id
              AND public.user_belongs_to_org(auth.uid(), c.organization_id)
        )
    );

DROP POLICY IF EXISTS "Org members can update contract_versions" ON public.contract_versions;
CREATE POLICY "Org members can update contract_versions" ON public.contract_versions
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.id = contract_versions.contract_id
              AND public.user_belongs_to_org(auth.uid(), c.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.id = contract_versions.contract_id
              AND public.user_belongs_to_org(auth.uid(), c.organization_id)
        )
    );

DROP POLICY IF EXISTS "Org members can delete contract_versions" ON public.contract_versions;
CREATE POLICY "Org members can delete contract_versions" ON public.contract_versions
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.id = contract_versions.contract_id
              AND public.user_belongs_to_org(auth.uid(), c.organization_id)
        )
    );


-- FINANCES POLICIES
DROP POLICY IF EXISTS "Org members can view finances" ON public.finances;
CREATE POLICY "Org members can view finances" ON public.finances
    FOR SELECT TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can insert finances" ON public.finances;
CREATE POLICY "Org members can insert finances" ON public.finances
    FOR INSERT TO authenticated
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can update finances" ON public.finances;
CREATE POLICY "Org members can update finances" ON public.finances
    FOR UPDATE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id))
    WITH CHECK (public.user_belongs_to_org(auth.uid(), organization_id));

DROP POLICY IF EXISTS "Org members can delete finances" ON public.finances;
CREATE POLICY "Org members can delete finances" ON public.finances
    FOR DELETE TO authenticated
    USING (public.user_belongs_to_org(auth.uid(), organization_id));
