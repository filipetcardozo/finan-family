## Env Local

NEXT_PUBLIC_REACT_APP_API_KEY = ""
NEXT_PUBLIC_REACT_APP_AUTH_DOMAIN = ""
NEXT_PUBLIC_REACT_APP_PROJECT_ID = ""
NEXT_PUBLIC_REACT_APP_STORAGE_BUCKET = ""
NEXT_PUBLIC_REACT_APP_MESSAGIN_SENDER_ID = ""
NEXT_PUBLIC_REACT_APP_APP_ID = ""

## Lançamentos mensais

Nas telas de despesas e receitas, **Repetir lançamentos** abre a revisão do mês selecionado.
O histórico considera os seis meses anteriores e sugere itens presentes em pelo menos dois
meses distintos. A lista começa pelos maiores valores. Despesas acima de R$ 300 com valores
semelhantes (tolerância de 20%) também podem ser sugeridas quando há outros gastos na mesma
categoria e descrição, como o almoço mensal junto de refeições avulsas. Gastos repetidos apenas
dentro de um mês e parcelas não são tratados automaticamente como mensalidades.
Sem descrição, os itens são reconhecidos pela categoria e por valores semelhantes, inclusive
abaixo de R$ 300. Valores diferentes na mesma categoria podem formar itens mensais separados;
outros lançamentos avulsos não eliminam a recorrência. Em Restaurante, a regra de valores acima
de R$ 300 continua valendo quando há várias compras no mês.

Selecione os itens, ajuste os valores e as datas e confirme o lote. **Adicionar do histórico**
permite incluir itens que ainda não foram reconhecidos como recorrentes. Os itens confirmados
ficam na lista mensal; pelo menu do item, **Parar de repetir** remove a sugestão dos próximos
meses e mantém os lançamentos anteriores. Nada é lançado sem confirmação.

As listas são salvas por usuário em `userSettings/{uid}`, nos campos
`recurringExpenseTemplates` e `recurringRevenueTemplates`. Os lançamentos continuam nas
coleções existentes, com `recurringTemplateId` e um ID determinístico por item/mês para
evitar duplicação em confirmações simultâneas ou novas tentativas. A gravação do lote e da
lista mensal é atômica. As regras do Firestore devem permitir ao usuário acessar seus próprios
lançamentos e documento de configurações, como nos fluxos atuais.

Execute os testes locais, sem acessar o Firebase real, com `npm run test:recurring`.

## Compras parceladas

Ao criar uma despesa, marque **Compra parcelada** para informar a quantidade de parcelas.
O campo **Valor da parcela** representa o valor de cada lançamento, e o formulário mostra
o total da compra. A primeira parcela usa a data escolhida; as demais seguem nos próximos
meses, mantendo o dia quando possível (31/01 → 28/02 → 31/03).

A descrição original é mantida com o sufixo **Parcela 1/3**, **Parcela 2/3**, etc., inclusive
quando a descrição está vazia. Todas são gravadas de uma vez na coleção de despesas.
Depois de criadas, as parcelas são lançamentos independentes: editar ou excluir uma não
altera as outras. A opção não aparece ao editar lançamentos nem no formulário de receitas.

Execute os testes locais com `npm run test:installments`.
