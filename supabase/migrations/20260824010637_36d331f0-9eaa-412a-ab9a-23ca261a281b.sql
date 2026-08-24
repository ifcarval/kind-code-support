-- 1. Enums
create type public.client_status as enum ('ativo', 'inativo', 'bloqueado');
create type public.billing_type as enum ('mensal', 'trimestral', 'semestral', 'anual', 'avulsa', 'personalizada');
create type public.client_service_status as enum ('ativo', 'pausado', 'cancelado', 'finalizado');
create type public.invoice_status as enum ('rascunho', 'pendente', 'vencida', 'paga', 'cancelada', 'renegociada');
create type public.payment_method as enum ('pix', 'boleto', 'cartao', 'transferencia', 'dinheiro', 'outro');

-- 2. Tables
create table public.companies (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    cnpj text unique,
    email text,
    telefone text,
    endereco text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    company_id uuid references public.companies(id),
    nome text not null,
    email text not null,
    telefone text,
    empresa text,
    cargo text,
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.clients (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) not null,
    nome_razao_social text not null,
    tipo_pessoa text check (tipo_pessoa in ('PF', 'PJ')),
    cpf_cnpj text,
    nome_fantasia text,
    email text,
    telefone text,
    telefone_secundario text,
    contato_principal text,
    endereco text,
    cidade text,
    estado text,
    cep text,
    observacoes text,
    status public.client_status default 'ativo',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.services (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) not null,
    nome text not null,
    descricao text,
    categoria text,
    valor_padrao decimal(12,2) default 0,
    tipo_cobranca public.billing_type default 'mensal',
    recorrente boolean default true,
    ativo boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.client_services (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) not null,
    client_id uuid references public.clients(id) not null,
    service_id uuid references public.services(id) not null,
    nome_servico text not null,
    descricao text,
    valor_mensal decimal(12,2) not null,
    tipo_cobranca public.billing_type not null,
    data_inicio date not null,
    data_fim date,
    dia_vencimento integer check (dia_vencimento >= 1 and dia_vencimento <= 31),
    status public.client_service_status default 'ativo',
    renovacao_automatica boolean default true,
    observacoes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table public.invoices (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) not null,
    client_id uuid references public.clients(id) not null,
    client_service_id uuid references public.client_services(id),
    numero_fatura text not null,
    competencia date not null,
    data_emissao date default current_date,
    data_vencimento date not null,
    data_pagamento timestamptz,
    descricao text,
    valor_original decimal(12,2) not null,
    desconto decimal(12,2) default 0,
    multa decimal(12,2) default 0,
    juros decimal(12,2) default 0,
    valor_final decimal(12,2) not null,
    status public.invoice_status default 'pendente',
    forma_pagamento public.payment_method,
    comprovante_url text,
    observacoes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(company_id, numero_fatura)
);

create table public.invoice_items (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid references public.invoices(id) on delete cascade not null,
    descricao text not null,
    quantidade decimal(12,2) default 1,
    valor_unitario decimal(12,2) not null,
    valor_total decimal(12,2) not null,
    created_at timestamptz default now()
);

create table public.payments (
    id uuid primary key default gen_random_uuid(),
    company_id uuid references public.companies(id) not null,
    invoice_id uuid references public.invoices(id) not null,
    valor_pago decimal(12,2) not null,
    data_pagamento timestamptz default now(),
    forma_pagamento public.payment_method not null,
    referencia_pagamento text,
    observacoes text,
    created_at timestamptz default now()
);

-- 3. Indexes
create index idx_clients_nome on public.clients(nome_razao_social);
create index idx_clients_email on public.clients(email);
create index idx_clients_cpf_cnpj on public.clients(cpf_cnpj);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);
create index idx_invoices_vencimento on public.invoices(data_vencimento);

-- 4. GRANTS
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.client_services to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.invoice_items to authenticated;
grant select, insert, update, delete on public.payments to authenticated;

grant all on public.companies to service_role;
grant all on public.profiles to service_role;
grant all on public.clients to service_role;
grant all on public.services to service_role;
grant all on public.client_services to service_role;
grant all on public.invoices to service_role;
grant all on public.invoice_items to service_role;
grant all on public.payments to service_role;

-- 5. RLS
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.client_services enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

-- Simple policies for multi-company (assumes users have company_id in profile)
create policy "Users can only access their own company data" on public.companies
    for all using (id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can access their own profile" on public.profiles
    for all using (id = auth.uid());

create policy "Users can access their company's clients" on public.clients
    for all using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can access their company's services" on public.services
    for all using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can access their company's client services" on public.client_services
    for all using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can access their company's invoices" on public.invoices
    for all using (company_id in (select company_id from public.profiles where id = auth.uid()));

create policy "Users can access their company's invoice items" on public.invoice_items
    for all using (invoice_id in (select id from public.invoices where company_id in (select company_id from public.profiles where id = auth.uid())));

create policy "Users can access their company's payments" on public.payments
    for all using (company_id in (select company_id from public.profiles where id = auth.uid()));

-- 6. Functions & Triggers

-- Function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply updated_at to tables
create trigger handle_updated_at_companies before update on public.companies for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at_profiles before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at_clients before update on public.clients for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at_services before update on public.services for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at_client_services before update on public.client_services for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at_invoices before update on public.invoices for each row execute procedure public.handle_updated_at();

-- Trigger for profile creation on signup
-- Note: Requires initial company creation or logic to handle company assignment
create or replace function public.handle_new_user()
returns trigger as $$
declare
    default_company_id uuid;
begin
    -- Create a default company for the new user if they don't have one
    insert into public.companies (nome) values ('Minha Empresa') returning id into default_company_id;

    insert into public.profiles (id, company_id, nome, email)
    values (new.id, default_company_id, coalesce(new.raw_user_meta_data->>'full_name', 'Usuário Novo'), new.email);
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 7. Recurring Billing Generation Function
create or replace function public.generate_monthly_invoices(p_company_id uuid default null)
returns integer as $$
declare
    rec record;
    v_invoice_id uuid;
    v_count integer := 0;
    v_competencia date := date_trunc('month', current_date)::date;
    v_vencimento date;
begin
    for rec in 
        select cs.*, c.nome_razao_social
        from public.client_services cs
        join public.clients c on c.id = cs.client_id
        where cs.status = 'ativo'
        and cs.recorrente = true
        and (p_company_id is null or cs.company_id = p_company_id)
        and not exists (
            select 1 from public.invoices i 
            where i.client_service_id = cs.id 
            and i.competencia = v_competencia
            and i.status != 'cancelada'
        )
    loop
        -- Calculate due date based on dia_vencimento
        v_vencimento := (date_trunc('month', current_date) + (rec.dia_vencimento - 1 || ' days')::interval)::date;
        
        -- If due date has already passed for this month, set to next month or handle as overdue
        -- For simplicity, we'll just set it for the current month's day
        
        insert into public.invoices (
            company_id, client_id, client_service_id, numero_fatura, competencia, 
            data_vencimento, descricao, valor_original, valor_final, status
        ) values (
            rec.company_id, rec.client_id, rec.id, 
            'INV-' || to_char(current_date, 'YYYYMM') || '-' || substring(rec.id::text, 1, 8),
            v_competencia, v_vencimento, rec.nome_servico, rec.valor_mensal, rec.valor_mensal, 'pendente'
        ) returning id into v_invoice_id;

        insert into public.invoice_items (
            invoice_id, descricao, quantidade, valor_unitario, valor_total
        ) values (
            v_invoice_id, rec.nome_servico, 1, rec.valor_mensal, rec.valor_mensal
        );

        v_count := v_count + 1;
    end loop;
    
    return v_count;
end;
$$ language plpgsql security definer;
