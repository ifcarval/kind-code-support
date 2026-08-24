-- 1. Campos extras em companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

-- 2. Campo em invoices para rastrear lembretes
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- 3. Enum para tipos de gatilho
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_trigger_type') THEN
        CREATE TYPE public.reminder_trigger_type AS ENUM ('due_soon', 'overdue', 'manual');
    END IF;
END $$;

-- 4. Tabela de templates
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    trigger_type public.reminder_trigger_type NOT NULL DEFAULT 'manual',
    days_offset INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitar RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- 6. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;

-- 7. Políticas RLS
CREATE POLICY "Users can view templates of their company"
    ON public.message_templates FOR SELECT
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert templates for their company"
    ON public.message_templates FOR INSERT
    TO authenticated
    WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update templates of their company"
    ON public.message_templates FOR UPDATE
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete templates of their company"
    ON public.message_templates FOR DELETE
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 8. Inserir templates padrão para empresas existentes (se houver)
INSERT INTO public.message_templates (company_id, name, content, trigger_type, days_offset)
SELECT id, 'Lembrete de Vencimento Próximo', 'Olá {cliente}, notamos que sua fatura nº {numero} no valor de {valor} vence em {vencimento}. Para sua comodidade, efetue o pagamento antes do prazo.', 'due_soon', 3
FROM public.companies;

INSERT INTO public.message_templates (company_id, name, content, trigger_type, days_offset)
SELECT id, 'Aviso de Fatura Atrasada', 'Prezado {cliente}, consta em nosso sistema que a fatura nº {numero} ({vencimento}) no valor de {valor} está pendente. Por favor, regularize sua situação.', 'overdue', 1
FROM public.companies;
