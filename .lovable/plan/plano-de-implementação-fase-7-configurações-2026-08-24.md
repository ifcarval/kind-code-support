# Plano de Implementação: Fase 7 - Configurações

Implementação da tela de configurações para gestão de dados da empresa, perfil do usuário e preferências do sistema (tema, vencimento, moeda e data).

## Tarefas

### 1. Banco de Dados e API
- Atualizar a tabela `profiles` ou criar `company_settings` para armazenar:
  - `due_day_default` (Integer, padrão 10)
  - `currency` (String, padrão 'BRL')
  - `date_format` (String, padrão 'DD/MM/YYYY')
- Criar hook `useSettings` para gerenciar o estado dessas configurações via Supabase.

### 2. Componentes de UI
- Criar `src/components/ThemeToggle.tsx` para alternância entre tema claro e escuro.
- Implementar formulários com `shadcn/ui` para:
  - **Dados do Perfil**: Nome, e-mail, foto.
  - **Dados da Empresa**: Razão social, CNPJ, endereço.
  - **Preferências**: Dia padrão de vencimento, formatos regionais.

### 3. Rotas e Navegação
- Implementar a rota `src/routes/settings.tsx`.
- Habilitar o link "Configurações" na Sidebar em `src/routes/index.tsx`.

### 4. Internacionalização e Formatação
- Garantir que `Intl.NumberFormat` e `Intl.DateTimeFormat` utilizem as preferências salvas.

## Detalhes Técnicos
- **Estado de Tema**: Utilizar `next-themes` ou uma implementação customizada no `__root.tsx` que manipula a classe `.dark`.
- **Validação**: Zod para validar CNPJ e e-mail nos formulários.
- **Segurança**: RLS garantindo que usuários só acessem configurações da sua própria empresa (`company_id`).
