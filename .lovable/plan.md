# Plano de Implementação: Correção da Restrição de Tipo de Pessoa em Clientes

Corrigir o erro "new row for relation clients violates check constraint clients_tipo_pessoa_check" ajustando os valores permitidos para 'PF' e 'PJ' no banco de dados e no formulário frontend.

## 1. Banco de Dados (Supabase)
- Identificar a restrição de verificação (check constraint) atual na tabela `clients`.
- Atualizar a restrição para permitir explicitamente os valores 'PF' (Pessoa Física) e 'PJ' (Pessoa Jurídica).
- Migrar dados existentes que usem 'F' ou 'J' para 'PF' e 'PJ', se necessário.

## 2. Frontend: Formulário de Clientes
- Atualizar o estado inicial em `src/routes/clients.tsx` para usar 'PJ' como padrão.
- Modificar o componente `Select` no formulário de cadastro/edição:
  - Opção: "Pessoa Física" (valor: 'PF').
  - Opção: "Pessoa Jurídica" (valor: 'PJ').
- Tornar o campo obrigatório e garantir que o formulário não seja enviado com valores vazios ou inválidos.
- Atualizar a lógica de mapeamento no `handleOpenModal` para tratar a conversão de valores antigos ('F' -> 'PF', 'J' -> 'PJ'), caso existam no banco.

## 3. Verificação
- Testar a criação de um novo cliente (PF e PJ) e verificar se a restrição do banco é respeitada.
- Validar a edição de clientes existentes.

