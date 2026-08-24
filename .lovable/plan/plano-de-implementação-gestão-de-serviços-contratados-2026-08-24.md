# Plano de Implementação: Gestão de Serviços Contratados

Implementação da tela de acompanhamento de serviços ativos por cliente, conforme detalhado na Fase 2 do projeto.

## Ações Realizadas
- Criar hook `useContractedServices` para gerenciar o CRUD de `client_services`.
- Criar nova rota `/contracted-services` para listagem e gestão global de contratos.
- Adicionar modal de edição de contrato e disparo de cobrança manual.
- Integrar navegação na Sidebar.

## Detalhes Técnicos
- **Hook**: `useContractedServices` utilizará Supabase para buscar dados da tabela `client_services` com joins em `clients` e `services`.
- **Interface**: Tabela responsiva com filtros por cliente e status.
- **Automação**: Chamada RPC para gerar faturas manuais pontuais a partir de um contrato.
- **Segurança**: Filtro obrigatório por `company_id` via RLS e lógica de aplicação.

## Próximos Passos
- Implementar `src/hooks/use-contracted-services.ts`.
- Implementar `src/routes/contracted-services.tsx`.
- Atualizar `src/routes/index.tsx` (Sidebar).
- Validar as ações de pausar/cancelar no banco.
