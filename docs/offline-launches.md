# Lançamentos offline

O formulário salva despesas, receitas e compras parceladas no IndexedDB antes de
confirmar o salvamento. Cada operação tem documentos com IDs definitivos. Os dados
pendentes entram nos totais do mês e recebem `pendingSync` apenas na apresentação.

`OfflineSyncProvider` recupera a fila da conta autenticada na abertura, no retorno
da conexão, ao voltar à aba e periodicamente. Cada aba precisa reivindicar uma
operação em uma transação local; a reivindicação expira se a aba for fechada. O
envio usa uma transação do Firestore para gravar todas as parcelas juntas. A fila
só é removida após a confirmação do servidor. Repetições usam os mesmos IDs e
preservam documentos existentes. Recusas do servidor mantêm a operação local e
mostram um erro com ação para tentar novamente.

O cache persistente do Firestore permite consultar os meses e categorias já
carregados. O service worker guarda a interface visitada. O primeiro acesso e o
login precisam ocorrer com conexão. Não há promessa de execução com o navegador
fechado: a sincronização é retomada na próxima abertura com a mesma conta.

Editar/excluir pendências e repetir lançamentos pelo histórico exigem conexão e
sincronização. Limpar os dados do site remove pendências ainda não enviadas.

Validação: `npm run test:offline`. Os testes usam IndexedDB compatível com a API do
navegador e um servidor simulado para desconexão, reinício, perda de confirmação,
concorrência entre abas, separação de contas e falhas de armazenamento/permissão.
