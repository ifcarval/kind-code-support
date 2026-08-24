# Plano de Implementação - Fase 5 e 6: Faturamento e Pagamentos

Este plano detalha a implementação das tabelas de faturamento, itens de fatura e pagamentos, além da lógica de automação e interface para gestão financeira.

## 1. Banco de Dados (Supabase)

### Novas Tabelas
- `invoices`: Registro principal de faturas (status, valores, competência).
- `invoice_items`: Itens detalhados de cada fatura.
- `payments`: Registro de pagamentos recebidos (suporta pagamentos parciais).

### Automações
- Trigger para atualizar status da fatura (`paga`, `pendente`, `vencida`) com base na soma dos pagamentos.
- Função `generate_monthly_invoices()` para criar faturas automaticamente a partir de `client_services` ativos.

## 2. Frontend (React)

### Novas Páginas/Componentes
- `/billing`: Listagem de faturas com filtros por status e cliente.
- `InvoiceModal`: Detalhes da fatura e formulário para registrar pagamentos.
- `BillingSummary`: Cards de resumo financeiro no Dashboard.

### Hooks
- `useBilling`: Gerenciamento de dados de faturamento e pagamentos.

## Detalhes Técnicos

- **Multi-tenant**: Todas as tabelas terão `company_id` e políticas RLS restritas ao `auth.uid()`.
- **Status da Fatura**: 
  - `rascunho`, `pendente`, `vencida`, `paga`, `cancelada`, `renegociada`.
- **Cron**: Agendar `generate_monthly_invoices()` via `pg_cron` (se disponível) ou endpoint seguro.
