-- Migration: Make organization_id optional in customers and adjust RLS policies for standalone Master management

ALTER TABLE public.customers ALTER COLUMN organization_id DROP NOT NULL;

-- Drop strict org-only policies for customers
DROP POLICY IF EXISTS "Org members can view customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can update customers" ON public.customers;
DROP POLICY IF EXISTS "Org members can delete customers" ON public.customers;

-- New RLS Policies for customers allowing Master (or authenticated admins) full CRUD without requiring organization_id
CREATE POLICY "Master and authenticated users can view customers" ON public.customers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Master and authenticated users can insert customers" ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Master and authenticated users can update customers" ON public.customers
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Master and authenticated users can delete customers" ON public.customers
    FOR DELETE TO authenticated
    USING (true);
