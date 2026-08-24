# Plano de Implementação: Importação Inteligente de Contratos

Este plano descreve a implementação da funcionalidade de importação de contratos com extração automática de dados (nome do cliente, serviço, valor, dia de vencimento) utilizando a IA do Lovable, conforme solicitado no arquivo `instrucoes-23.md`.

## 1. Infraestrutura de Backend
- Criar uma nova tabela `contract_imports` para registrar os uploads e o status do processamento.
- Adicionar suporte a armazenamento de arquivos (bucket `contracts`) no Lovable Cloud.
- Criar um **Server Function** (`processContractFile`) que:
    1. Recebe o arquivo.
    2. Utiliza o `ai_gateway` para analisar o conteúdo do contrato (OCR/Text Extraction).
    3. Extrai campos estruturados (Cliente, CNPJ, Valor Mensal, Dia de Vencimento, Nome do Serviço).

## 2. Hooks e Lógica de Negócio
- Criar `useContractImport` hook para gerenciar o upload e a extração.
- Integrar com `useClients` e `useServices` para sugerir correspondências ou criar novos registros se necessário.

## 3. Interface de Usuário (Frontend)
- Adicionar botão "Importar Contrato" na tela de **Serviços Contratados**.
- Criar um modal de importação com:
    - Área de Dropzone para upload do PDF/Imagem.
    - Tela de revisão dos dados extraídos pela IA.
    - Confirmação de vinculação (ou criação) do cliente e serviço.

## Detalhes Técnicos
- **IA**: Utilizaremos o modelo padrão do Lovable via AI Gateway para processar o texto do contrato e retornar um JSON estruturado.
- **Fluxo**: Upload -> Extração IA -> Revisão Humana -> Salvamento em `client_services`.

---
*Nota: As instruções literais em `src/routes/index.tsx` foram mantidas conforme solicitado.*
