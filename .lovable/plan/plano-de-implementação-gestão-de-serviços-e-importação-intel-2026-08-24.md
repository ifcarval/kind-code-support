# Plano de Implementação: Gestão de Serviços e Importação Inteligente

Este plano detalha a implementação das fases solicitadas nos arquivos `instrucoes-23.md` e `instrucoes-24.md`.

## 1. Catálogo de Serviços (instrucoes-24.md)
- **Ação**: Popular a tabela `services` com os itens padrão solicitados.
- **Serviços**: 
  - Social Media
  - Fotógrafo
  - Gestor de Redes Sociais (Criação + Tráfego Pago)
  - Criação de LP
  - Gestor de Tráfego Pago
- **Implementação**: Script SQL para inserção desses serviços vinculados à empresa do usuário.

## 2. Importação Inteligente de Contratos (instrucoes-23.md)
- **Ação**: Implementar funcionalidade de upload e extração automática de dados de contratos.
- **Backend**:
  - Criar bucket `contracts` para armazenamento.
  - Criar Server Function que processa o arquivo via AI Gateway para extrair: Nome do Cliente, Serviço, Valor, Vencimento.
- **Frontend**:
  - Novo botão "Importar Contrato" em **Serviços Contratados**.
  - Modal de upload e revisão de dados extraídos.
  - Fluxo de criação automática de `client_services` a partir da extração.

## 3. Manutenção da Instrução Visual
- Manter o comentário literal solicitado na linha 1 de `src/routes/index.tsx`.

---
*Este plano expande a infraestrutura atual para permitir automação no cadastro de serviços contratados.*
