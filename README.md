# dgs-ai-first

Entregas do treinamento AI First — DB1.

## Estrutura do repositório

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

### Exercícios entregues

| Exercício | Entregável | Resumo |
|---|---|---|
| 2.1 — MCP servers | [`dev-ex2.1-mcp-servers.md`](dev-ex2.1-mcp-servers.md) + [`mcp-config/.mcp.json`](mcp-config/.mcp.json) | Mapeamento dos 5 MCP servers do projeto (GitHub, Azure DevOps, Azure AI Search, Azure OpenAI, Confluence), configuração real com permissões least-privilege, e 4 riscos de segurança específicos ao contexto com mitigações. |
| 2.2 — SDD do query endpoint | [`dev-ex2.2-sdd-query-endpoint.md`](dev-ex2.2-sdd-query-endpoint.md) + [`query-endpoint/`](query-endpoint/) | `tasks.md` com 7 tasks atômicas decompostas do `plan.md`, implementação real da TASK-001 (Azure Function v4 + Zod, 6/6 testes passando), e revisão crítica com 4 pontos de ajuste. |
| 2.3 — Estratégia de skills | [`dev-ex2.3-skills-strategy.md`](dev-ex2.3-skills-strategy.md) + [`skills/`](skills/) | Árvore de 15 skills (Foundation → Domain → Artifact) com mapeamento de criação/consumo por papel, e o `SKILL.md` completo da skill Foundation mais crítica do projeto (`error-handling`). |

### Rodando o query-endpoint

```bash
cd query-endpoint
npm install
npm test
npx tsc --noEmit
```