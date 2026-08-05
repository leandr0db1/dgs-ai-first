# Desenvolvedor — Exercício 2.2: Implementação de Spec com Spec Driven Development

> **Nota sobre ferramentas:** este ambiente não tem o GitHub Copilot conectado como extensão ativa; o código abaixo foi gerado diretamente pelo Claude cumprindo o mesmo papel (implementação a partir da task, para revisão crítica humana em seguida) — mesma limitação de ferramenta já registrada nos exercícios anteriores onde o Copilot era exigido.
>
> **Mesma ressalva do Exercício 2.1:** o **Anexo C** (estrutura do repositório) não estava disponível. O código foi organizado em `query-endpoint/src/functions/` e `query-endpoint/src/schemas/`, uma convenção comum em projetos Azure Functions v4 com TypeScript — mas idealmente deveria seguir o layout real de `db1/novatech-assistant`.

## 1. tasks.md

Ver [`query-endpoint/tasks.md`](query-endpoint/tasks.md) — 7 tasks atômicas (TASK-001 a TASK-007), cada uma com ID, descrição, critérios de aceite verificáveis, dependências e estimativa (P/M/G).

Durante a decomposição, encontrei uma **inconsistência real dentro do próprio `plan.md`** fornecido: a seção "Approach" define o orçamento do system prompt como **~2K tokens**, mas a seção "Prior Decisions" cita a **ADR-0002 do Cenário 1 como ~4K tokens** — dois números diferentes para a mesma decisão, dentro do mesmo documento. Registrei isso como bloqueador explícito na TASK-004, em vez de escolher um valor arbitrariamente. Isso seria facilmente perdido se a spec fosse só "lida" e implementada sem uma decomposição atenta.

## 2. Implementação da TASK-001

Código em [`query-endpoint/`](query-endpoint/):
- `src/schemas/query-schema.ts` — validação Zod.
- `src/functions/query.ts` — Azure Function HTTP trigger (`POST /api/query`).
- `test/query.test.ts` — 6 testes cobrindo os casos de validação.

Rodado de verdade (`npm install && npx vitest run`): **6/6 testes passando**. `npx tsc --noEmit` sem erros de tipo.

Detalhe deliberado: o enum `clientTier` do schema Zod só aceita `"Gold" | "Silver" | "Standard"` — o mesmo conjunto de tiers válidos definido no SLA-2024 do Cenário 1 (sem "Platinum"). Isso significa que a própria camada de validação de entrada já rejeita o tier inexistente antes mesmo de qualquer lógica de negócio ou chamada ao LLM — uma segunda linha de defesa contra a alucinação de tier, mais forte que depender só do guardrail de prompt do Exercício 1.2.

## 3. Revisão crítica do código gerado

1. **`authLevel: "function"` é um mecanismo de autenticação fraco para um endpoint que vai para produção atrás do bot do Teams.** Uma function key é um segredo compartilhado — não identifica o chamador, não é revogável por chamador individual, e costuma vazar em logs/configuração por descuido. Antes do go-live, isso precisa evoluir para validação de token Azure AD/Entra ID (ou Azure API Management com OAuth na frente da function), não permanecer como o mecanismo final de autenticação.

2. **O logging usa `context.log` nativo do `@azure/functions`, não `pino` como a decisão técnica do `plan.md` exige.** Isso é esperado nesta task (TASK-006 é quem integra `pino`), mas é exatamente o tipo de detalhe que passa despercebido num code review apressado: se TASK-006 for adiada ou esquecida, o projeto nunca converge para logging estruturado, e a decisão registrada no plan.md fica letra morta. Deixei um comentário explícito no código apontando isso como placeholder, não como implementação definitiva.

3. **(Bônus) A resposta 400 expõe a estrutura bruta do `fieldErrors` do Zod diretamente ao chamador.** Para uma ferramenta interna (bot do Teams / painel do atendente) isso é aceitável, mas deveria ser uma decisão deliberada e documentada — não um efeito colateral de como a biblioteca de validação formata o próprio erro. Se este endpoint um dia for exposto além do uso interno, essa superfície de erro precisa ser revisada.

4. **(Bônus) Nenhum limite de tamanho de corpo é aplicado antes do parse do JSON.** O `max(1000)` do Zod limita o campo `question` depois de parseado, mas um payload muito grande ainda seria lido e parseado antes da validação rejeitá-lo. Isso deveria ser resolvido na camada de API Management/Function host (limite de tamanho de requisição), não assumido como "resolvido" só porque o schema valida o conteúdo.

## 4. Entregável

- `query-endpoint/tasks.md`
- `query-endpoint/src/schemas/query-schema.ts`, `query-endpoint/src/functions/query.ts`
- `query-endpoint/test/query.test.ts` (6/6 passando)
- Esta revisão crítica (seção 3), com 4 pontos — 2 exigidos pelo enunciado, 2 bônus.
