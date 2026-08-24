# Plano de Implementação: Importação de Contratos na Aba Clientes

Implementar a funcionalidade de registro e gestão de contratos assinados ou pré-validados dentro da área de detalhes do cliente.

## 1. Banco de Dados (Supabase)
- Criar o enum `contract_status`: `pre_validado`, `assinado`, `em_analise`, `vencido`, `cancelado`.
- Criar a tabela `contracts`:
  - `id`, `company_id` (tenant), `client_id` (relacionamento).
  - `status` (enum), `titulo`, `numero_contrato`.
  - `data_inicio`, `data_termino`, `data_assinatura`.
  - `valor_mensal`, `dia_vencimento`.
  - `service_id` (opcional, vínculo com catálogo), `client_service_id` (opcional, vínculo com serviço ativo).
  - `observacoes`, `document_link` (URL externa).
- Habilitar RLS e criar políticas baseadas em `company_id`.
- Adicionar `GRANT`s necessários para `authenticated` e `service_role`.

## 2. Frontend: Hooks e Componentes
- Criar `src/hooks/use-contracts.ts` para gerenciar o CRUD de contratos.
- Criar `src/components/clients/ImportContractModal.tsx`:
  - Formulário moderno com validação Zod.
  - Seleção de status com cores.
  - Vínculo com serviços existentes.
- Criar `src/components/clients/ContractsSection.tsx`:
  - Tabela/Lista de contratos no perfil do cliente.
  - Ações de visualizar, editar, cancelar e excluir.
  - Lógica de cores para status: Assinado (Verde), Pré-validado (Azul), Em análise (Amarelo), Vencido (Vermelho), Cancelado (Cinza).

## 3. Integração e Controle de Acesso
- Atualizar `src/routes/clients.$id.tsx`:
  - Integrar a seção de Contratos.
  - Exibir o botão "Importar contrato" apenas para usuários com `role === 'owner'`.
- Lógica de Negócio:
  - Contrato **Assinado**: Opção para gerar/vincular um serviço contratado ativo.
  - Impedir exclusão se houver cobranças (invoices) vinculadas ao serviço do contrato (permitir apenas cancelamento).

## 4. Segurança
- Validar permissões de `owner` nas rotas e nos componentes.
- Garantir que usuários comuns não vejam a área de contratos.

