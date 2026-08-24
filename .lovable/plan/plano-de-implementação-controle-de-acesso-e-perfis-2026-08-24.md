# Plano de Implementação: Controle de Acesso e Perfis

## 1. Banco de Dados (Supabase)
- Adicionar coluna `role` à tabela `profiles`.
- Tipo: enum `app_user_role` ('owner', 'user').
- Adicionar colunas de demonstração à tabela `companies`: `trial_ends_at`, `subscription_status`.
- Executar migração SQL para atualizar o esquema e políticas RLS.

## 2. Autenticação e Cadastro
- Atualizar `src/routes/index.tsx` (AuthPage) para incluir um seletor de perfil no cadastro.
- Salvar o perfil selecionado na tabela `profiles` durante o `signUp`.

## 3. Navegação Global
- Atualizar `src/components/AppLayout.tsx` para ler o perfil do usuário (via `useProfile` ou `useSettings`).
- Condicionalmente renderizar itens da barra lateral com base no perfil.
- Esconder "Configurações", "Clientes", "Serviços" e "Serviços Contratados" para usuários comuns.

## 4. Proteção de Rotas
- Implementar verificação de permissão nas rotas protegidas (`clients`, `services`, `contracted-services`, `settings`).
- Criar um componente de guarda de rota ou adicionar lógica de redirecionamento se o perfil não tiver permissão.

## Detalhes Técnicos
- O perfil 'Proprietário' (Owner) mapeia para acesso total.
- O perfil 'Usuário comum' mapeia para acesso apenas ao Dashboard e Faturamento.
- Uso do hook `useProfile` para centralizar a lógica de autorização.
