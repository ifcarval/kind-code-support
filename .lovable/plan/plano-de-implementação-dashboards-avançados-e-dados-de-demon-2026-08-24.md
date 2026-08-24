# Plano de Implementação: Dashboards Avançados e Dados de Demonstração

Este plano detalha a implementação das consultas analíticas avançadas, expansão da base de dados de demonstração e melhorias na interface do usuário (Dashboard) conforme as novas instruções.

## 1. Backend: Consultas e Views Analíticas
Criar uma nova migração com views otimizadas para:
- **Relatórios Mensais**: Comparativo Previsto vs Recebido dos últimos 12 meses.
- **Distribuição por Status**: Quantidade de faturas por status (pago, pendente, vencido).
- **Métricas de Cliente**: Ticket médio, taxa de inadimplência e clientes inadimplentes.
- **Performance de Serviços**: Lista dos serviços mais rentáveis.
- **Agenda Financeira**: Próximos vencimentos em 7, 15 e 30 dias.

## 2. Backend: Dados de Demonstração (Seed)
Expandir os dados iniciais para garantir gráficos realistas:
- Gerar faturas históricas para os últimos 12 meses.
- Simular diferentes comportamentos de pagamento (pagamentos em dia, atrasados, parciais e inadimplentes).
- Vincular serviços variados aos 10 clientes de teste.

## 3. Frontend: Dashboards e Gráficos
- **Integração de Gráficos**: Adicionar a biblioteca `recharts` para exibir a receita mensal e distribuição de status.
- **UI de Dashboard**: 
    - Novos cards para métricas como "Taxa de Inadimplência" e "Ticket Médio".
    - Tabelas de "Próximos Vencimentos" e "Clientes Inadimplentes".
- **Melhorias de Navegação**:
    - Sidebar colapsável.
    - Cabeçalho com seletor de período e busca global funcional.
- **Modo Escuro**: Garantir consistência visual em ambos os temas.

## Detalhes Técnicos
- As views utilizarão `SECURITY INVOKER` para respeitar as políticas de RLS existentes.
- Utilização de `date_trunc` e `generate_series` no SQL para criar a série histórica de 12 meses mesmo que não haja dados em alguns meses.
- O hook `useDashboardStats` será expandido para incluir os novos endpoints das views.
