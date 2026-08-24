# Plano de Implementação: Gestão de Cobranças (Faturamento Avançado)

Aprimorar a página de faturamento para uma gestão completa de cobranças, incluindo filtros avançados, indicadores de desempenho, registro de pagamentos e detalhes de faturas, conforme as instruções da Fase 5.

## Alterações Técnicas

### Backend (Lovable Cloud / Supabase)
- Nenhuma alteração de esquema necessária (tabelas `invoices`, `payments` e `invoice_items` já existem).
- Utilizar consultas existentes e filtros do PostgREST via Supabase JS Client.

### Frontend
- **Hook `useBilling`**: Expandir para suportar filtros (período, status, cliente, serviço) e busca.
- **Página de Cobranças (`src/routes/billing.tsx`)**:
  - Implementar cards de indicadores (Pendentes, Vencidas, Pagas).
  - Adicionar barra de busca e filtros (Select/Popover).
  - Aprimorar a tabela com mais colunas e ações (Pagar, Ver Detalhes, Editar, Cancelar).
  - Implementar Modal/Dialog para "Nova Fatura" e "Detalhes da Fatura".
  - Implementar Modal/Dialog para "Registrar Pagamento" (com upload de comprovante via URL ou observações).
- **Estilização**: Garantir o uso das cores semânticas para status (Verde para Paga, Amarelo para Pendente, Vermelho para Vencida, Cinza para Cancelada, Azul para Rascunho).

## Etapas de Implementação

1. **Atualizar `useBilling.ts`**: Adicionar suporte a parâmetros de filtro na função `fetchInvoices`.
2. **Componentes de UI**: Criar/Ajustar componentes para os modais de cobrança e pagamento.
3. **Refatorar `billing.tsx`**:
   - Layout com Sidebar (já existente) e cabeçalho com indicadores.
   - Implementar formulário de busca e filtros.
   - Expandir a tabela de listagem.
   - Integrar modais de ação.
4. **Validação**: Testar fluxos de filtragem, registro de pagamento e geração de faturas.
5. **Manutenção**: Preservar o comentário de texto literal solicitado no arquivo `src/routes/index.tsx`.
