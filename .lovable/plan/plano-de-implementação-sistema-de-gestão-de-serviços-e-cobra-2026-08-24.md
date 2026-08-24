# Plano de Implementação - Sistema de Gestão de Serviços e Cobranças (Fase 2)

O backend já foi configurado com sucesso. Agora vamos implementar a interface do usuário (Frontend) seguindo as especificações do arquivo `instrucoes-3.md`.

## 1. Autenticação e Perfil
- Implementar tela de Login e Cadastro usando Lovable Cloud Auth.
- Criar hook `useProfile` para gerenciar os dados do perfil do usuário logado.
- Adicionar página de Configurações do Perfil para editar nome, telefone, empresa, cargo e avatar.

## 2. Gestão de Clientes
- Criar rota `/clients` para listagem de clientes com busca (nome, e-mail, telefone, CPF/CNPJ).
- Criar formulário de criação/edição de clientes com validação de campos obrigatórios.
- Implementar visualização de detalhes do cliente.

## 3. Catálogo de Serviços
- Criar rota `/services` para gerenciar o catálogo de serviços da empresa.
- Implementar formulário para definir nome, descrição, categoria, valor padrão e tipo de cobrança.

## 4. Serviços Contratados (Assinaturas)
- Criar interface para vincular serviços do catálogo aos clientes.
- Permitir personalização de valores e datas de vencimento por contrato.
- Exibir status do serviço (ativo, pausado, cancelado).

## Detalhes Técnicos
- **Layout**: Sidebar para navegação principal, Header com informações do perfil.
- **Estado**: TanStack Query para busca de dados e sincronização com o banco.
- **Componentes**: shadcn/ui para tabelas, formulários e modais.
- **Segurança**: Garantir que `company_id` seja filtrado em todas as consultas (RLS já configurado).

A primeira tarefa será substituir a página inicial atual pelo Dashboard principal.