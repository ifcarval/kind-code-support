# Salão Santa Felicidade

Sistema de gestão do **Salão Santa Felicidade**, integrado ao Lovable e ao Supabase.

**Aplicação oficial:** https://salaodefestaapp.lovable.app

## Funcionalidades

- consulta pública de disponibilidade;
- solicitações e gestão de eventos;
- cadastro de clientes;
- calendário;
- contratos;
- financeiro;
- área do cliente;
- controle de acesso por perfil/organização.

## Arquitetura

O projeto usa **React 19**, **TanStack Start/Router**, **Vite**, **Tailwind CSS** e **Supabase**.

A fonte oficial do projeto é este repositório. Alterações enviadas para a branch principal ficam disponíveis para sincronização com o projeto Lovable conectado.

## Segurança da disponibilidade pública

A rota pública de agendamentos consulta somente os campos necessários para informar se uma data está livre ou ocupada. Dados internos do evento, como cliente, valores, observações e demais informações operacionais, não são solicitados por essa tela.

> A proteção definitiva dos dados também deve ser mantida pelas políticas RLS do Supabase. Nunca utilize a service role key no frontend.

## Desenvolvimento local

Requisitos:

- Node.js compatível com as dependências do projeto;
- npm;
- variáveis de ambiente do Supabase fornecidas pelo projeto Lovable/Supabase.

```sh
git clone https://github.com/ifcarval/kind-code-support.git
cd kind-code-support
npm install
npm run dev
```

Para validar uma alteração antes da publicação:

```sh
npm run build
npm run lint
```

## Publicação

O domínio de referência é:

```text
https://salaodefestaapp.lovable.app
```

Ao alterar URLs de autenticação no Supabase, mantenha esse domínio entre os **Redirect URLs / Site URL** autorizados.

## Observações

Este projeto substitui o modelo antigo baseado em backend Node/MySQL do ZIP original. A versão atual utiliza a infraestrutura do Lovable + Supabase e deve ser preservada como base, incorporando apenas regras e fluxos necessários ao Salão Santa Felicidade.
