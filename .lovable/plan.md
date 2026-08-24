# Plano de Implementação: Importação de Contratos na Aba Clientes

Adicionar funcionalidade para registrar e gerenciar contratos assinados ou pré-validados diretamente no perfil do cliente, com suporte a status coloridos, vínculo com serviços e controle de acesso para administradores.

## Mudanças no Banco de Dados
- Criar tipo enum `contract_status` ('pre_validado', 'assinado', 'em_analise', 'vencido', 'cancelado').
- Criar tabela `contracts` com os campos solicitados (status, título, número, datas, valor, dia vencimento, serviço relacionado, observações, link externo).
- Implementar RLS na tabela `contracts` com `company_id`.
- Criar função para verificar permissão de administrador (Proprietário).

## Mudanças no Frontend
- **Hooks**: Criar `src/hooks/use-contracts.ts` para gerenciar CRUD de contratos.
- **Componentes**:
  - `ImportContractModal`: Modal com formulário para cadastro/edição de contratos.
  - `ContractsList`: Componente para listar contratos no perfil do cliente com ações de visualizar, editar e cancelar.
- **Rotas**:
  - Atualizar `src/routes/clients.$id.tsx` para incluir a nova seção "Contratos" e o botão "Importar contrato" (visível apenas para Proprietários).
- **Estilização**: Adicionar lógica de cores para os status dos contratos.

## Detalhes Técnicos
- Vínculo entre Contrato Assinado e Geração de Cobranças: Se status for 'Assinado', permitir criar/vincular serviço contratado.
- Proteção de Rotas e UI: Usar `isOwner` do hook `useProfile` para restringir ações de escrita em contratos.
- Validação: Impedir exclusão de contratos com cobranças vinculadas (permitir apenas cancelamento).

