# dgs-ai-first

Entregas do treinamento AI First — DB1.

## Estrutura do repositório

Cada Cenário-Âncora é entregue em uma branch própria:

- `cenario-1` — Cenário-Âncora 1: Fase de Entendimento e Contexto (NovaTech).
- `cenario-2` (esta branch) — Cenário-Âncora 2: Fase de Estruturação do Trabalho (NovaTech).
- `cenario-3` — Cenário-Âncora 3 (a definir).

## Cenário-Âncora 2 — papel: Desenvolvedor

Cenário completo em [`exercicio-2-fase-estruturacao.md`](exercicio-2-fase-estruturacao.md). Temas: MCP, Recorte de Domínio/SDD, AGENTS.md, Skills. Documentos de apoio (Anexo A e B, reaproveitados do Cenário 1) na raiz do repositório.

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
npm test        # roda a suíte de testes (vitest)
npx tsc --noEmit # type-check
```
