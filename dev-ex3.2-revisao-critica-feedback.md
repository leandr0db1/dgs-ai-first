# Desenvolvedor — Exercício 3.2: Revisão Crítica de Código Gerado por IA

> **Nota sobre o processo:** o enunciado pede uma revisão própria primeiro, depois uma segunda revisão usando o Claude, para comparar. Neste ambiente as duas revisões foram feitas em passadas distintas e deliberadas — a primeira lendo o código linha a linha contra o AGENTS.md, a segunda revisitando com foco em segurança/arquitetura, o que uma leitura única tende a não priorizar da mesma forma. Registro isso porque a "segunda opinião" só tem valor se for genuinamente uma leitura diferente, não uma repetição.

## 1. Minha revisão (1ª passada — checagem linha a linha contra o AGENTS.md)

| # | Problema | Classificação |
|---|---|---|
| 1 | `body = await request.json() as any` — nenhuma validação de schema antes de usar os campos. | Violação do AGENTS.md ("Zod para validação de input") |
| 2 | `console.log('Feedback recebido:', ...)` | Violação do AGENTS.md ("pino para logging, nunca console.log") |
| 3 | `const { CosmosClient } = require('@azure/cosmos')` dentro da função | Violação do AGENTS.md ("imports estáticos no topo, nunca require dinâmico") |
| 4 | `attendantEmail` entra no `JSON.stringify(feedback)` que vai para o log | Violação do AGENTS.md ("nunca logar dados pessoais") — e também problema de segurança/privacidade |
| 5 | `rating` não é validado (poderia ser `-5`, `"cinco"`, `999`) | Bug potencial — decorre diretamente do problema 1 |
| 6 | Nenhum tratamento de erro em `container.items.create(feedback)` — se o Cosmos falhar, a exceção sobe crua | Bug potencial |

## 2. Segunda revisão (2ª passada — foco em segurança/arquitetura, papel do Claude)

Revisitando com outra lente, além de confirmar os 6 pontos acima:

7. **`CosmosClient` é instanciado dentro do handler, a cada requisição.** Isso recria a conexão a cada chamada — desperdício de recursos e latência, e sob carga (320 chamados/dia projetados desde o Cenário 1, mais o volume de feedback) pode esgotar conexões do Cosmos DB. Deveria ser um singleton reaproveitado entre invocações.
8. **`attendantEmail` logado é mais grave do que "só" uma violação de AGENTS.md — é um risco de conformidade (LGPD).** E-mail é dado pessoal; se os logs vão para uma ferramenta de observabilidade acessível a mais pessoas do que quem deveria ver dado de atendente identificável, isso é uma exposição real, não só um desvio de estilo de código.
9. **Resposta de sucesso `{ status: 200, body: 'OK' }` quebra o contrato dos outros endpoints do projeto.** O `query` endpoint (Exercício 2.2) responde com `jsonBody` estruturado; este responde com uma string solta. Quem consome os dois endpoints (painel web) precisa tratar cada um de um jeito — inconsistência de API evitável.

## 3. Comparação

As duas passadas concordam nos 4 problemas mínimos exigidos pelo enunciado (itens 1-4). A segunda passada não achou nada que a primeira tivesse "errado", mas mudou a **gravidade** atribuída ao item 4 (de "desvio de estilo" para "risco de conformidade") e acrescentou 2 problemas de natureza diferente — não são violações de regra explícita do AGENTS.md, são decisões de arquitetura que só aparecem quando se pergunta "o que acontece em produção sob carga" em vez de "isso segue o guia de estilo".

## 4. Código reescrito

- [`query-endpoint/src/schemas/feedback-schema.ts`](query-endpoint/src/schemas/feedback-schema.ts) — schema Zod estrito (`queryId`, `rating` 1-5, `comment` opcional com limite, `attendantEmail` validado como e-mail).
- [`query-endpoint/src/functions/feedback/handler.ts`](query-endpoint/src/functions/feedback/handler.ts) — corrige todos os 9 pontos:
  - Import estático de `CosmosClient` no topo (resolve #3).
  - `pino` para logging, nunca `console.log` (resolve #2).
  - `logger.info`/`logger.error` só recebem `{ queryId, rating }` ou `{ queryId, err }` — nunca `attendantEmail` nem `comment` (resolve #4/#8, testado explicitamente).
  - Validação Zod antes de qualquer uso dos campos (resolve #1/#5).
  - `container.items.create` dentro de `try/catch`, retornando 503 estruturado em vez de deixar a exceção subir crua (resolve #6).
  - `CosmosClient` cacheado em variável de módulo, resolvido preguiçosamente (não no import) e reaproveitado entre requisições (resolve #7).
  - Resposta de sucesso em `jsonBody: { status: "ok" }`, consistente com o padrão do `query` endpoint (resolve #9).
  - Container e logger injetáveis via `createFeedbackHandler(container?, logger?)`, permitindo testar tudo isso sem Cosmos DB real nem depender da saída do pino.

Testado de verdade: **22/22 testes passando** no total do projeto (13 anteriores + 9 novos, incluindo 2 testes que verificam explicitamente que `attendantEmail`/`comment` nunca aparecem em nenhuma chamada de log, no caminho de sucesso e no de erro). `tsc --noEmit` limpo.

## 5. Entregável
- Revisão própria (seção 1) e segunda revisão (seção 2), com comparação honesta (seção 3).
- `feedback-schema.ts` e `handler.ts` reescritos, seguindo o AGENTS.md.
- `test/feedback-handler.test.ts` — 9 testes, incluindo os 2 que travam regressão do problema de PII em log.
