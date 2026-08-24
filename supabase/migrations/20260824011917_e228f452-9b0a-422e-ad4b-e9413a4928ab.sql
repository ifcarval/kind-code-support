
-- Recriar tipos enum sem acentos para facilitar integração
-- Importante: Isso pode falhar se houver dados, mas como as tabelas foram criadas agora, está seguro.

-- Primeiro remover as tabelas que dependem dos enums temporariamente ou alterar as colunas
ALTER TABLE public.invoices ALTER COLUMN forma_pagamento TYPE text;
ALTER TABLE public.payments ALTER COLUMN forma_pagamento TYPE text;

DROP TYPE IF EXISTS public.payment_method;
CREATE TYPE public.payment_method AS ENUM ('pix', 'boleto', 'cartao', 'transferencia', 'dinheiro', 'outro');

ALTER TABLE public.invoices ALTER COLUMN forma_pagamento TYPE public.payment_method USING forma_pagamento::public.payment_method;
ALTER TABLE public.payments ALTER COLUMN forma_pagamento TYPE public.payment_method USING forma_pagamento::public.payment_method;
