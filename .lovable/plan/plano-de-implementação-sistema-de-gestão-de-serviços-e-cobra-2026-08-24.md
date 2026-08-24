# Plano de Implementação: Sistema de Gestão de Serviços e Cobranças

Este plano detalha a construção do backend e da estrutura inicial do sistema, seguindo as especificações do arquivo `instrucoes.md`. O foco inicial será a infraestrutura de dados no Lovable Cloud (Supabase).

## Objetivos
- Implementar a estrutura completa do banco de dados (PostgreSQL).
- Configurar autenticação e perfis de usuário.
- Definir regras de segurança (RLS) para multi-empresa.
- Criar funções para automação de cobranças recorrentes.
- Popular o sistema com dados iniciais para demonstração.

## Etapas Técnicas

### 1. Estrutura Base e Autenticação
- **Tabelas de Perfis e Empresas**:
  - `companies`: Dados da empresa/assinante.
  - `profiles`: Dados do usuário vinculado à empresa.
- **Autenticação**: Configurar e-mail/senha e Google.
- **Automação de Perfil**: Trigger para criar perfil no cadastro.

### 2. Cadastro de Clientes e Serviços
- **Clientes (`clients`)**: Cadastro completo com validações brasileiras.
- **Catálogo (`services`)**: Definição dos serviços oferecidos.
- **Serviços Contratados (`client_services`)**: Vínculo cliente-serviço com valores personalizados.

### 3. Faturamento e Cobranças
- **Faturas (`invoices`)**: Registro de cobranças mensais.
- **Itens de Fatura (`invoice_items`)**: Detalhamento da cobrança.
- **Pagamentos (`payments`)**: Registro de recebimentos (integrais ou parciais).

### 4. Inteligência e Automação
- **Automação de Cobranças**: Função SQL para gerar faturas mensais automaticamente para serviços recorrentes ativos.
- **Segurança Multi-empresa**: Políticas RLS garantindo que um usuário só acesse dados de sua própria `company_id`.
- **Views de Dashboard**: Consultas otimizadas para faturamento, inadimplência e KPIs.

### 5. Dados de Exemplo
- Inserção de dados fictícios (10 clientes, 8 serviços, faturas históricas) para visualização imediata no dashboard.

## Detalhes Técnicos
- **Banco de Dados**: PostgreSQL com extensões `pg_cron` e `pg_net` (para automações futuras).
- **Segurança**: Row Level Security (RLS) em 100% das tabelas.
- **Moeda**: Tratamento nativo em Real (BRL).
- **Relacionamentos**: Integridade referencial com `ON DELETE CASCADE` ou restrições de inativação.
