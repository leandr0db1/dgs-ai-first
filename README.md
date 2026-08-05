# dgs-ai-first

Entregas do treinamento AI First — DB1.

## Estrutura do repositório

Cada Cenário-Âncora é entregue em uma branch própria:

- `cenario-1` (esta branch) — Cenário-Âncora 1: Fase de Entendimento e Contexto (NovaTech).
- `cenario-2` — Cenário-Âncora 2 (a definir).
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
.venv/Scripts/pip install -r requirements.txt   # Linux/Mac: .venv/bin/pip
.venv/Scripts/python ingest.py                  # indexa os documentos no ChromaDB
.venv/Scripts/python test_pipeline.py           # roda os testes contra o gabarito do Anexo B
```

`chroma_db/` e `prompts_output/` são gerados localmente pelos scripts acima e não ficam no repositório (ver `.gitignore`).
