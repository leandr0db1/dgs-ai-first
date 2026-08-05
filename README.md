# dgs-ai-first

Entregas do treinamento AI First — DB1.

## Estrutura do repositório

Cada Cenário-Âncora é entregue em uma branch própria:

- `cenario-1` — Cenário-Âncora 1: Fase de Entendimento e Contexto (NovaTech).
- `cenario-2` — Cenário-Âncora 2: Fase de Estruturação do Trabalho (NovaTech).
- `cenario-3` (esta branch) — Cenário-Âncora 3: Fase de Governança e Validação (NovaTech).

## Cenário-Âncora 3 — papel: Desenvolvedor

Cenário completo em [`cenario-3-exercicios-fase-governanca.md`](cenario-3-exercicios-fase-governanca.md). Temas: Harness Engineering (structured outputs, human-in-the-loop) e Revisão Crítica de Outputs de IA. Documentos de apoio (Anexo A e B, reaproveitados dos cenários anteriores) na raiz do repositório. O código evolui o `query-endpoint/` entregue no Cenário 2.
Cada Cenário-Âncora é desenvolvido em uma branch própria:

- `cenario-1` — Cenário-Âncora 1: Fase de Entendimento e Contexto (NovaTech).
- `cenario-2` — Cenário-Âncora 2: Fase de Estruturação do Trabalho (NovaTech).
- `cenario-3` — Cenário-Âncora 3 (a definir).

## Cenário-Âncora 1 — papel: Desenvolvedor

Cenário completo, anexos de apoio e exercícios em [`exercicio-fase-1-entendimento.md`](exercicio-fase-1-entendimento.md), [`anexo-a-documentacao-simulada-novatech.md`](anexo-a-documentacao-simulada-novatech.md) e [`anexo-b-chunks-referencia-rag.md`](anexo-b-chunks-referencia-rag.md).

Documentos-fonte da NovaTech usados nos exercícios:

- `POL-001-politica-devolucao.md`
- `PROC-042-frete-especial-v1.md`
- `PROC-042-v2-frete-especial-revisado.md`
- `SLA-2024-tabela-sla-clientes.md`
- `FAQ-atendimento.md`

### Exercícios entregues

| Exercício | Entregável | Resumo |
|---|---|---|
| 1.1 — Viabilidade técnica | [`dev-ex1.1-viabilidade-tecnica.md`](dev-ex1.1-viabilidade-tecnica.md) | Desafios por tipo de fonte, estimativa de tokens da base, orçamento de contexto e estratégia de chunking, com uma rodada de autocrítica e revisão. |
| 1.2 — Prototipação de prompt | [`dev-ex1.2-prototipacao-prompt.md`](dev-ex1.2-prototipacao-prompt.md) | System prompt v1/v2 com mapeamento de contexto estático/dinâmico, testado com 3 perguntas reais e iterado a partir das falhas encontradas. |
| 1.3 — Pipeline de RAG | [`dev-ex1.3-pipeline-rag.md`](dev-ex1.3-pipeline-rag.md) + [`rag-pipeline/`](rag-pipeline/) | Pipeline funcional (ChromaDB + sentence-transformers) testado contra o gabarito do Anexo B, com achados reais de falha de retrieval e correções propostas. |

### Rodando o pipeline de RAG

```bash
cd rag-pipeline
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python ingest.py
.venv/Scripts/python test_pipeline.py
```

`chroma_db/` e `prompts_output/` são gerados localmente pelos scripts acima e não ficam no repositório (ver `.gitignore`).

## Cenário-Âncora 2 — papel: Desenvolvedor

Cenário completo em [`exercicio-2-fase-estruturacao.md`](exercicio-2-fase-estruturacao.md).

Temas: MCP, Recorte de Domínio/SDD, AGENTS.md e Skills. Documentos de apoio (Anexo A e B, reaproveitados do Cenário 1) na raiz do repositório.

### Rodando os testes
| 2.1 — MCP servers | [`dev-ex2.1-mcp-servers.md`](dev-ex2.1-mcp-servers.md) + [`mcp-config/.mcp.json`](mcp-config/.mcp.json) | Mapeamento dos 5 MCP servers do projeto (GitHub, Azure DevOps, Azure AI Search, Azure OpenAI, Confluence), configuração real com permissões least-privilege, e 4 riscos de segurança específicos ao contexto com mitigações. |
| 2.2 — SDD do query endpoint | [`dev-ex2.2-sdd-query-endpoint.md`](dev-ex2.2-sdd-query-endpoint.md) + [`query-endpoint/`](query-endpoint/) | `tasks.md` com 7 tasks atômicas decompostas do `plan.md`, implementação real da TASK-001 (Azure Function v4 + Zod, 6/6 testes passando), e revisão crítica com 4 pontos de ajuste. |
| 2.3 — Estratégia de skills | [`dev-ex2.3-skills-strategy.md`](dev-ex2.3-skills-strategy.md) + [`skills/`](skills/) | Árvore de 15 skills (Foundation → Domain → Artifact) com mapeamento de criação/consumo por papel, e o `SKILL.md` completo da skill Foundation mais crítica do projeto (`error-handling`). |

## Cenário-Âncora 3 — papel: Desenvolvedor

Cenário completo em [`cenario-3-exercicios-fase-governanca.md`](cenario-3-exercicios-fase-governanca.md). Temas: Harness Engineering (structured outputs, human-in-the-loop) e Revisão Crítica de Outputs de IA. Documentos de apoio (Anexo A e B, reaproveitados dos cenários anteriores) na raiz do repositório. O código evolui o `query-endpoint/` entregue no Cenário 2.
Cada Cenário-Âncora é desenvolvido em uma branch própria:

- `cenario-1` — Cenário-Âncora 1: Fase de Entendimento e Contexto (NovaTech).
- `cenario-2` — Cenário-Âncora 2: Fase de Estruturação do Trabalho (NovaTech).
- `cenario-3` — Cenário-Âncora 3 (a definir).
  
### Exercícios entregues

| Exercício | Entregável | Resumo |
|---|---|---|
| 3.1 — Structured output e guardrails determinísticos | [`dev-ex3.1-structured-output-harness.md`](dev-ex3.1-structured-output-harness.md) + [`query-endpoint/src/services/response-validator.ts`](query-endpoint/src/services/response-validator.ts) | Schema Zod estrito para o structured output do assistente, 2 guardrails determinísticos (fonte obrigatória com sentinela `NAO_ENCONTRADO`, e bloqueio de resposta que afirme ser possível devolver carga perigosa). Inclui um bug real de regex encontrado e corrigido rodando os testes. |
| 3.2 — Revisão crítica de código gerado por IA | [`dev-ex3.2-revisao-critica-feedback.md`](dev-ex3.2-revisao-critica-feedback.md) + [`query-endpoint/src/functions/feedback/handler.ts`](query-endpoint/src/functions/feedback/handler.ts) | Duas passadas de revisão crítica do módulo de feedback gerado pelo Copilot (9 problemas encontrados: validação ausente, `console.log`, `require` dinâmico, PII em log, cliente Cosmos recriado por requisição, sem tratamento de erro, contrato de resposta inconsistente) e reescrita completa seguindo o AGENTS.md. |



### Rodando o query-endpoint

```bash
cd query-endpoint
npm install
npm test         # 22 testes (query, response-validator, feedback-handler)
npx tsc --noEmit # type-check
```
npm test
npx tsc --noEmit
```
