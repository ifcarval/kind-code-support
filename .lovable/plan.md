# Plano de Implementação - Gestão de Clientes e Catálogo de Serviços

Este plano detalha a implementação das telas de Clientes e Serviços, conforme as fases 2 e 3 descritas nas instruções.

## 1. Gestão de Clientes

### 1.1. Tela de Listagem (`/clients`)
- **Interface**: Tabela responsiva com busca (nome, e-mail, telefone, CPF/CNPJ) e filtros (status, tipo de pessoa).
- **Funcionalidades**:
  - Paginação.
  - CRUD completo (Cadastrar, Editar, Excluir).
  - Status visually represented by Badges.

### 1.2. Detalhes do Cliente (`/clients/$id`)
- **Seções**:
  - **Dados Cadastrais**: Informações completas do cliente.
  - **Serviços Contratados**: Lista de serviços vinculados ao cliente com preços customizados.
  - **Financeiro**: Histórico de cobranças e cards de resumo (Faturado, Pago, Em Aberto, Vencido).
  - **Ações**: Botões para vincular novo serviço e criar fatura manual.

## 2. Catálogo de Serviços (`/services`)

### 2.1. Tela de Catálogo
- **Interface**: Lista/Grid de serviços oferecidos pela empresa.
- **Funcionalidades**:
  - CRUD de Serviços (Nome, Descrição, Preço Base, Periodicidade).
  - Ativação/Desativação de serviços.
  - Visualização de receita mensal gerada por cada serviço.
  - Listagem de clientes que utilizam o serviço selecionado.

## Detalhes Técnicos

### Backend (Lovable Cloud / Supabase)
- **Tabelas Relacionadas**: `clients`, `services`, `client_services`, `invoices`, `payments`.
- **RLS**: Garantir que todos os filtros e listagens respeitem o `company_id` do usuário logado.

### Frontend (TanStack Start)
- **Novas Rotas**: `src/routes/clients.tsx`, `src/routes/clients.$id.tsx`, `src/routes/services.tsx`.
- **Hooks**:
  - `useClients`: Gestão de estado e chamadas para a tabela `clients`.
  - `useServices`: Gestão de estado para a tabela `services`.
  - `useClientDetails`: Focado na agregação de dados financeiros e serviços do cliente.
- **Componentes UI**: Reutilização de `Table`, `Badge`, `Card` e `Button`.

---
*Nota: A instrução literal "Analise o arquivo instrucoes.md anexo e siga todas as instruções." será mantida conforme solicitado.*
