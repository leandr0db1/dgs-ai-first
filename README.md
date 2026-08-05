# dgs-ai-first

Entregas do treinamento AI First — DB1.

## Estrutura do repositório

Cada Cenário-Âncora é entregue em uma branch própria:

- `cenario-1` — Cenário-Âncora 1: Fase de Entendimento e Contexto (NovaTech).
- `cenario-2` — Cenário-Âncora 2: Fase de Estruturação do Trabalho (NovaTech).
- `cenario-3` (esta branch) — Cenário-Âncora 3: Fase de Governança e Validação (NovaTech).

## Cenário-Âncora 3 — papel: Desenvolvedor

Cenário completo em [`cenario-3-exercicios-fase-governanca.md`](cenario-3-exercicios-fase-governanca.md). Temas: Harness Engineering (structured outputs, human-in-the-loop) e Revisão Crítica de Outputs de IA. Documentos de apoio (Anexo A e B, reaproveitados dos cenários anteriores) na raiz do repositório. O código evolui o `query-endpoint/` entregue no Cenário 2.

### Exercícios entregues

| Exercício | Entregável | Resumo |
|---|---|---|
| 3.1 — Structured output e guardrails determinísticos | [`dev-ex3.1-structured-output-harness.md`](dev-ex3.1-structured-output-harness.md) + [`query-endpoint/src/services/response-validator.ts`](query-endpoint/src/services/response-validator.ts) | Schema Zod estrito para o structured output do assistente, 2 guardrails determinísticos (fonte obrigatória com sentinela `NAO_ENCONTRADO`, e bloqueio de resposta que afirme ser possível devolver carga perigosa). Inclui um bug real de regex encontrado e corrigido rodando os testes. |
| 3.2 — Revisão crítica de código gerado por IA | [`dev-ex3.2-revisao-critica-feedback.md`](dev-ex3.2-revisao-critica-feedback.md) + [`query-endpoint/src/functions/feedback/handler.ts`](query-endpoint/src/functions/feedback/handler.ts) | Duas passadas de revisão crítica do módulo de feedback gerado pelo Copilot (9 problemas encontrados: validação ausente, `console.log`, `require` dinâmico, PII em log, cliente Cosmos recriado por requisição, sem tratamento de erro, contrato de resposta inconsistente) e reescrita completa seguindo o AGENTS.md. |

### Rodando os testes

```bash
cd query-endpoint
npm install
npm test         # 22 testes (query, response-validator, feedback-handler)
npx tsc --noEmit # type-check
```
