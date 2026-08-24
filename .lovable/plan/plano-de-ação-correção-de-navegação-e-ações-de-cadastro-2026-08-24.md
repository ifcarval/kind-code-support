# Plano de Ação: Correção de Navegação e Ações de Cadastro

Melhorar a experiência de navegação e as funcionalidades de criação, edição e exclusão em todo o sistema.

## Alterações Técnicas

### 1. Gestão de Clientes (`/clients`)
- Implementar formulário/modal para "Novo Cliente".
- Implementar formulário/modal para "Editar Cliente".
- Adicionar visualização de detalhes (já existente, garantir acesso).
- Validar funcionalidade de exclusão.

### 2. Catálogo de Serviços (`/services`)
- Implementar formulário/modal para "Novo Serviço".
- Implementar formulário/modal para "Editar Serviço".
- Validar status ativo/inativo.

### 3. Serviços Contratados (`/contracted-services`)
- Adicionar botão "Novo Contrato" (manual) além da importação por IA.
- Implementar formulário/modal para criação manual de contratos.
- Adicionar ações de edição nos contratos existentes.

### 4. Gestão de Cobranças (`/billing`)
- Implementar formulário/modal para "Nova Fatura" (manual).
- Adicionar ações de cancelamento e edição de faturas pendentes.

### 5. Navegação e UI
- Garantir que todos os botões "Novo" estejam no topo direito das páginas.
- Unificar o estilo das tabelas e ações (Visualizar, Editar, Excluir).

## Detalhes de Implementação
- Utilizar os hooks existentes (`useClients`, `useServices`, `useBilling`, `useContractedServices`).
- Criar componentes de formulário reutilizáveis para os modais.
- Utilizar `sonner` para notificações de sucesso/erro.
- Garantir RLS passando `company_id` do perfil do usuário em todas as criações.
