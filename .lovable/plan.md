# Plano de Implementação - Automação de Faturamento e Dashboard

Este plano detalha o aprimoramento da função de geração automática de faturas e a criação de views otimizadas para o dashboard, conforme as novas instruções.

## 1. Banco de Dados (Supabase)

### Automação de Faturamento
- Atualizar `generate_monthly_invoices` para:
  - Criar itens automaticamente na `invoice_items`.
  - Usar o `dia_vencimento` do serviço contratado.
  - Implementar sequenciador de número de fatura por empresa.
  - Garantir que apenas serviços ativos e recorrentes sejam processados.

### Views de Dashboard
- Criar `view_dashboard_stats`: Agregado de faturamento, clientes ativos e serviços.
- Criar `view_billing_summary`: Faturamento mensal projetado vs. realizado.

## 2. Frontend (React)

### Faturamento
- Botão "Gerar Faturas do Mês" na página `/billing` para execução manual da função do banco.

### Dashboard
- Integração das novas views nos cards de estatísticas.
- Gráfico/Resumo de faturamento no Dashboard principal.

## Detalhes Técnicos
- **Segurança**: Verificação de `company_id` em todas as novas funções e views.
- **Performance**: Uso de `SECURITY DEFINER` com `search_path` restrito para as funções de sistema.
