# Plano de Implementação - Edição de Serviços e Contratos

Este plano descreve as alterações necessárias para permitir a edição de valores de serviços no catálogo e tornar editáveis os nomes e valores de contratos durante a importação e gestão.

## 1. Catálogo de Serviços
- **Interface de Edição**: Garantir que o formulário de edição de serviços permita alterar todos os campos, incluindo o `valor_padrao`.
- **Máscara de Moeda**: Implementar uma máscara de moeda brasileira (R$) no campo de valor do serviço para melhor experiência do usuário.
- **Persistência**: Assegurar que as alterações reflitam apenas em novos contratos vinculados a esse serviço, mantendo a integridade dos contratos e cobranças existentes.

## 2. Serviços Contratados (Gestão)
- **Nome e Valor Editáveis**: Adicionar o campo `nome_servico` ao formulário de edição de contrato para permitir nomes personalizados (texto livre).
- **Máscara de Moeda**: Aplicar a máscara de moeda brasileira (R$) ao campo `valor_mensal`.
- **Regras de Negócio**: Garantir que alterações no contrato não modifiquem cobranças já geradas, valendo apenas para faturas futuras.

## 3. Importação de Contratos (IA)
- **Revisão Editável**: Alterar a tela de revisão da extração por IA para que os campos `Cliente`, `Serviço`, `Valor Mensal`, `Vencimento` e `Data de Início` sejam totalmente editáveis antes da confirmação final.
- **Vinculação Flexível**: Permitir que o usuário corrija eventuais erros de leitura da IA antes de salvar o contrato no banco de dados.

## Detalhes Técnicos
- Utilização de `Intl.NumberFormat` e componentes customizados de Input para a máscara de moeda.
- Atualização dos hooks `useServices` e `useContractedServices` para suportar as novas atualizações de campos, se necessário.
- Modificação dos componentes de formulário em `src/routes/services.tsx` e `src/routes/contracted-services.tsx`.
