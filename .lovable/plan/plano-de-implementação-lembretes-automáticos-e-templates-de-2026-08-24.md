# Plano de Implementação: Lembretes Automáticos e Templates de Texto

O objetivo é implementar um sistema de lembretes automáticos para faturas vencendo ou em atraso, permitindo que a empresa mantenha uma comunicação eficiente com seus clientes. Além disso, será criado um sistema de templates de texto para padronizar as mensagens enviadas.

## Mudanças no Banco de Dados

1. **Criar tabela `message_templates`**:
    - `id` (uuid)
    - `company_id` (uuid)
    - `name` (text): Nome do template (ex: "Lembrete de Vencimento").
    - `content` (text): Conteúdo com tags dinâmicas (ex: "Olá {cliente}, sua fatura de {valor} vence em {vencimento}").
    - `trigger_type` (enum): `due_soon` (vencendo em breve), `overdue` (atrasada), `manual`.
    - `days_offset` (int): Dias antes ou depois do vencimento para o gatilho automático.

2. **Adicionar campos na tabela `companies`**:
    - `auto_reminders_enabled` (boolean): Ativa/desativa lembretes automáticos.
    - `whatsapp_enabled` (boolean): Indica se a empresa usa integração WhatsApp (opcional, para UI futura).

3. **Adicionar campo na tabela `invoices`**:
    - `last_reminder_sent_at` (timestamp): Data do último lembrete enviado.

## Integração no Backend (Server Functions)

1. **Criar função `sendReminder`**:
    - Simula o envio de uma mensagem (por enquanto, apenas registra o envio no banco e mostra um toast).
    - Aceita `invoice_id` e `template_id`.
    - Realiza a substituição de tags dinâmicas no conteúdo do template.

2. **Criar função `processAutomaticReminders`**:
    - Função (que poderia ser chamada por um cron) para buscar faturas que atendem aos critérios de gatilho dos templates automáticos e "enviar" os lembretes.

## Alterações na Interface (Frontend)

1. **Gestão de Templates (Configurações)**:
    - Nova aba "Mensagens" em `/settings` para CRUD de templates.

2. **Ações em Cobranças (`/billing`)**:
    - Botão "Enviar Lembrete" em cada linha da tabela de faturas.
    - Modal para selecionar o template e revisar o texto (com as variáveis já preenchidas) antes de enviar.

3. **Status de Notificação**:
    - Indicador visual na tabela de faturas mostrando se um lembrete já foi enviado e quando.

## Detalhes Técnicos
- Utilização de `createServerFn` para lógica de processamento de texto.
- RLS em `message_templates` garantindo isolamento por `company_id`.
- Hooks `use-notifications` ou extensão do `use-billing` para gerenciar as ações de lembrete.
