# Desenvolvedor — Exercício 2.3: Definição de Estratégia de Skills do Projeto

> **Mesma ressalva dos Exercícios 2.1 e 2.2:** o Anexo C não estava disponível para consulta direta; a estrutura `/skills/foundation/`, `/skills/domain/`, `/skills/artifact/` usada abaixo segue exatamente o que o próprio enunciado descreve, então foi possível aplicá-la mesmo sem o anexo.

## 1. Árvore de skills

A árvore parte dos 5 artefatos repetidos listados no enunciado (endpoints RAG, testes de integração, componentes React, documentação técnica, specs de produto) e das duas skills de nível Foundation que qualquer código TypeScript do projeto depende — não apenas os artefatos listados.

```
skills/
├── foundation/
│   ├── typescript-conventions.md
│   ├── error-handling.md         ← implementada neste exercício (seção 3)
│   ├── structured-logging.md
│   └── env-config.md
├── domain/
│   ├── azure-function-rag-endpoint.md
│   ├── integration-test-pattern.md
│   ├── react-component-pattern.md
│   ├── adr-documentation-pattern.md
│   └── sdd-spec-pattern.md
└── artifact/
    ├── generate-rag-endpoint.md
    ├── generate-integration-test.md
    ├── generate-response-card-component.md
    ├── generate-feedback-form-component.md
    ├── generate-module-readme.md
    └── generate-sdd-tasks.md
```

## 2. Mapeamento: nome, ativação, criação, consumo, frequência

### Foundation

| Skill | Frase de ativação (o que o agente reconhece) | Quem cria | Quem consome | Frequência |
|---|---|---|---|---|
| `typescript-conventions` | "gerar/revisar código TypeScript do projeto" | Tech Lead | Todos os Devs via Copilot (base de todo código) | Altíssima — implícita em toda geração de código |
| `error-handling` | "tratar erro/exceção em endpoint ou função" | Tech Lead (com input dos Devs, formalizando o que a revisão do Exercício 2.2 já apontou) | Devs via Copilot; Tech Lead via Claude em code review | Alta — toda função que pode falhar |
| `structured-logging` | "adicionar logging/observabilidade a uma função" | Tech Lead | Devs via Copilot (TASK-006-like); QA via Claude para checar telemetria em testes | Média — por módulo/endpoint novo |
| `env-config` | "acessar configuração/segredo/variável de ambiente" | Tech Lead + Dev sênior (baseado no trabalho de MCP do Exercício 2.1) | Devs via Copilot, ao integrar um novo serviço externo | Baixa-média |

### Domain

| Skill | Frase de ativação | Quem cria | Quem consome | Frequência |
|---|---|---|---|---|
| `azure-function-rag-endpoint` | "estruturar um endpoint com padrão RAG" | Dev sênior + Tech Lead (baseado nas ADRs do Cenário 1 e no `plan.md` do Exercício 2.2) | Devs via Copilot, a cada novo endpoint RAG | Alta no início do projeto, decrescente depois |
| `integration-test-pattern` | "escrever teste de integração de endpoint" | QA + Dev sênior | Devs via Copilot; QA via Claude para revisar cobertura | Alta — um conjunto de testes por endpoint |
| `react-component-pattern` | "organizar componente React do painel" | Product Specialist (UX) + Dev front-end | Devs via Copilot; Product Specialist via Claude Design para checar consistência | Média — cresce com o número de telas |
| `adr-documentation-pattern` | "documentar decisão arquitetural / escrever README de módulo" | Tech Lead | Todo o time via Claude, ao registrar uma decisão | Baixa-média — por decisão, não por linha de código |
| `sdd-spec-pattern` | "escrever requirements/plan/tasks no formato SDD" | Tech Lead + Product Specialist | Product Specialist (requirements), Tech Lead (plan), Devs via Copilot (tasks) | Alta — um ciclo por módulo novo |

### Artifact

| Skill | Frase de ativação | Quem cria | Quem consome | Frequência |
|---|---|---|---|---|
| `generate-rag-endpoint` | "criar um novo endpoint RAG a partir de uma spec" | Dev sênior, mantida pelo Tech Lead | Devs via Copilot | Alta nas primeiras semanas, depois esporádica |
| `generate-integration-test` | "gerar teste de integração para um endpoint existente" | QA | Devs via Copilot, ao finalizar um endpoint | Alta, pareada com a anterior |
| `generate-response-card-component` | "criar o card de resposta do assistente no painel" | Dev front-end | Devs via Copilot | Baixa — poucos componentes desse tipo no projeto |
| `generate-feedback-form-component` | "criar o formulário de feedback do atendente" | Dev front-end + Product Specialist (regras de negócio) | Devs via Copilot | Baixa — criado uma vez, raramente regenerado |
| `generate-module-readme` | "gerar README de um módulo a partir do código e da spec" | Tech Lead | Devs via Copilot, ao finalizar um módulo | Média — um por módulo entregue |
| `generate-sdd-tasks` | "decompor um plan.md em tasks.md atômico" | Tech Lead (formaliza o que foi feito manualmente no Exercício 2.2) | Devs via Claude, no início de cada módulo | Alta — um ciclo por módulo |

A árvore reflete visão de time, não só de desenvolvimento: Product Specialist cria/consome 2 skills (componentes React, specs), QA cria/consome 2 (testes de integração e sua geração), Tech Lead está envolvido na criação de praticamente todas (papel natural de guardião de padrões), mas nenhuma skill tem só "Tech Lead cria, Tech Lead consome" — todas têm um consumidor de fato em outro papel.

## 3. SKILL.md da Foundation mais importante: `error-handling`

**Por que essa e não `typescript-conventions`:** `typescript-conventions` é mais usada em volume, mas é genérica — qualquer projeto TypeScript teria uma parecida. `error-handling` é a que mais **outras skills do projeto dependem diretamente**: `azure-function-rag-endpoint` (Domain) precisa dela para tratar falha de embedding/busca/geração; `integration-test-pattern` (Domain) testa exatamente os casos que ela define; `generate-rag-endpoint` e `generate-integration-test` (Artifact) geram código que só é consistente entre si se ambos seguirem o mesmo contrato de erro. É a skill mais "raiz" da árvore para este projeto especificamente — um assistente de RAG tem muitas dependências externas (embedding, busca, geração) que podem falhar de formas diferentes, e sem um contrato único, cada endpoint inventaria seu próprio formato de erro.

Arquivo completo: [`skills/foundation/error-handling.md`](skills/foundation/error-handling.md).

## 4. Entregável
- Árvore de skills (seção 1).
- Mapeamento de criação/consumo/frequência para as 15 skills (seção 2).
- `skills/foundation/error-handling.md` completo (seção 3 + arquivo).
