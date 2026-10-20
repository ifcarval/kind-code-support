-- Criar tabela event_types se não existir
CREATE TABLE IF NOT EXISTS event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir índice único para idempotência na carga inicial
CREATE UNIQUE INDEX IF NOT EXISTS event_types_name_category_idx ON event_types (name, category);

-- Ativar RLS
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública ou autenticada de event_types" ON event_types;
CREATE POLICY "Permitir leitura pública ou autenticada de event_types" ON event_types
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir gestão por administradores de event_types" ON event_types;
CREATE POLICY "Permitir gestão por administradores de event_types" ON event_types
    FOR ALL USING (true);

-- Adicionar colunas de suporte na tabela events se necessário
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type_id') THEN
        ALTER TABLE events ADD COLUMN event_type_id UUID REFERENCES event_types(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'custom_event_type') THEN
        ALTER TABLE events ADD COLUMN custom_event_type TEXT;
    END IF;
END $$;

-- Inserção idempotente dos tipos iniciais de eventos
INSERT INTO event_types (name, category, is_active, sort_order) VALUES
-- 1. Festas sociais
('Aniversário adulto', 'Festas sociais', true, 10),
('Festa infantil', 'Festas sociais', true, 20),
('Festa de 15 anos', 'Festas sociais', true, 30),
('Casamento', 'Festas sociais', true, 40),
('Noivado', 'Festas sociais', true, 50),
('Chá de bebê', 'Festas sociais', true, 60),
('Chá revelação', 'Festas sociais', true, 70),
('Chá de panela', 'Festas sociais', true, 80),
('Chá de lingerie', 'Festas sociais', true, 90),
('Bodas e aniversário de casamento', 'Festas sociais', true, 100),
('Confraternização familiar', 'Festas sociais', true, 110),
('Festa temática', 'Festas sociais', true, 120),
('Festa de formatura', 'Festas sociais', true, 130),
('Festa de aposentadoria', 'Festas sociais', true, 140),

-- 2. Eventos religiosos
('Culto ou celebração religiosa', 'Eventos religiosos', true, 10),
('Encontro de igreja', 'Eventos religiosos', true, 20),
('Batizado', 'Eventos religiosos', true, 30),
('Primeira comunhão', 'Eventos religiosos', true, 40),
('Crisma', 'Eventos religiosos', true, 50),
('Retiro ou encontro religioso', 'Eventos religiosos', true, 60),
('Festa religiosa ou comunitária', 'Eventos religiosos', true, 70),

-- 3. Eventos empresariais e profissionais
('Confraternização de empresa', 'Eventos empresariais e profissionais', true, 10),
('Reunião empresarial', 'Eventos empresariais e profissionais', true, 20),
('Treinamento', 'Eventos empresariais e profissionais', true, 30),
('Palestra', 'Eventos empresariais e profissionais', true, 40),
('Workshop', 'Eventos empresariais e profissionais', true, 50),
('Conferência ou congresso', 'Eventos empresariais e profissionais', true, 60),
('Lançamento de produto', 'Eventos empresariais e profissionais', true, 70),
('Feira ou exposição', 'Eventos empresariais e profissionais', true, 80),
('Encontro de networking', 'Eventos empresariais e profissionais', true, 90),

-- 4. Eventos educacionais e comunitários
('Formatura', 'Eventos educacionais e comunitários', true, 10),
('Reunião escolar', 'Eventos educacionais e comunitários', true, 20),
('Encontro comunitário', 'Eventos educacionais e comunitários', true, 30),
('Arrecadação de fundos ou evento beneficente', 'Eventos educacionais e comunitários', true, 40),
('Apresentação cultural', 'Eventos educacionais e comunitários', true, 50),
('Encontro de associação ou grupo', 'Eventos educacionais e comunitários', true, 60),

-- 5. Reuniões e celebrações diversas
('Almoço ou jantar comemorativo', 'Reuniões e celebrações diversas', true, 10),
('Churrasco', 'Reuniões e celebrações diversas', true, 20),
('Brunch', 'Reuniões e celebrações diversas', true, 30),
('Reunião de família', 'Reuniões e celebrações diversas', true, 40),
('Despedida', 'Reuniões e celebrações diversas', true, 50),
('Evento cultural', 'Reuniões e celebrações diversas', true, 60),
('Outro', 'Reuniões e celebrações diversas', true, 70)
ON CONFLICT (name, category) DO NOTHING;
