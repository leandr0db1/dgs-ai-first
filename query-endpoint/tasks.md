# tasks.md — Query Endpoint

> Decomposição atômica do `plan.md` do query endpoint (fase de Estruturação, Cenário-Âncora 2).
> Cada task é implementável e testável de forma independente, dado que as dependências anteriores já existam (reais ou mockadas).

## TASK-001 — Setup do endpoint HTTP e validação de entrada
- **Descrição:** Azure Function HTTP trigger `POST /api/query`, validando o corpo da requisição com Zod (`question` obrigatória, `clientTier` e `sessionId` opcionais).
- **Critérios de aceite:**
  - Requisição sem `question` retorna 400 com `error: "validation_error"` e detalhe do campo.
  - Corpo que não é JSON válido retorna 400 com `error: "invalid_json"`.
  - `clientTier` fora do enum (`Gold`/`Silver`/`Standard`) é rejeitado.
  - Requisição válida retorna 200 (ou, enquanto as demais tasks não existem, 501 explícito — nunca 200 com corpo vazio).
  - Suíte de testes automatizados cobrindo os casos acima passa.
- **Dependências:** nenhuma.
- **Estimativa:** P

## TASK-002 — Cliente de embedding via Azure OpenAI (com retry)
- **Descrição:** função que recebe a pergunta validada e retorna o embedding via SDK do Azure OpenAI, com retry exponential backoff.
- **Critérios de aceite:**
  - Chamada bem-sucedida retorna o vetor de embedding.
  - Falha transitória (5xx/timeout) é retentada com backoff exponencial (número de tentativas e base documentados no código).
  - Falha definitiva (após esgotar retries) propaga um erro tipado (`EmbeddingError`), não uma exceção genérica.
- **Dependências:** TASK-001.
- **Estimativa:** M

## TASK-003 — Busca de chunks no Azure AI Search
- **Descrição:** função que recebe o embedding e retorna os top-5 chunks mais similares, incluindo `source_document` e metadado de vigência de cada um.
- **Critérios de aceite:**
  - Retorna no máximo 5 chunks, ordenados por score de similaridade.
  - Cada chunk inclui `source_document` e data de vigência (necessário para a regra de priorização de versão mais recente, ADR-0003 do Cenário 1).
  - Índice vazio ou erro de conexão retorna um erro tratado (`SearchUnavailableError`), não uma exceção não tratada que derruba a function.
- **Dependências:** TASK-002.
- **Estimativa:** M

## TASK-004 — Montagem do prompt respeitando o orçamento de contexto
- **Descrição:** monta o prompt final (system prompt + chunks + pergunta) sem ultrapassar o orçamento de contexto.
- **⚠️ Bloqueador a resolver antes de estimar/implementar:** o `plan.md` informa dois valores diferentes para o orçamento de system prompt — a seção "Approach" diz **~2K tokens**, mas "Prior Decisions" cita a **ADR-0002: ~4K tokens**. Essa ambiguidade precisa ser esclarecida com o Tech Lead antes desta task começar; não deve ser decidida arbitrariamente pelo desenvolvedor.
- **Critérios de aceite:**
  - O tamanho do prompt montado é medido (em tokens) e logado.
  - Se os chunks recuperados excederem o orçamento, os de menor score são descartados até caber — nunca trunca um chunk no meio.
  - O system prompt é lido de `/prompts/system-prompt.md`, nunca hardcoded na função.
- **Dependências:** TASK-003 e resolução do bloqueador acima.
- **Estimativa:** M

## TASK-005 — Chamada ao GPT-4o e formatação da resposta
- **Descrição:** envia o prompt montado ao GPT-4o e formata a resposta HTTP com `answer` e `sources`.
- **Critérios de aceite:**
  - Resposta 200 inclui `answer` e `sources` (lista de `source_document`).
  - Timeout do modelo usa a mesma política de retry da TASK-002; se esgotar, retorna 503 com mensagem clara — nunca deixa a requisição pendurada.
  - `sources` nunca inclui um documento que não esteja entre os chunks retornados pela TASK-003 (nenhuma citação inventada).
- **Dependências:** TASK-004.
- **Estimativa:** M

## TASK-006 — Structured logging com pino
- **Descrição:** instrumentar TASK-001 a TASK-005 com logging estruturado via `pino` (decisão técnica do `plan.md`), substituindo os usos provisórios de `context.log`.
- **Critérios de aceite:**
  - Todo log é JSON estruturado, não string livre.
  - Um único `correlationId` por requisição aparece em todos os logs daquela requisição.
  - Logs nunca incluem o conteúdo integral da pergunta do cliente nem o texto dos chunks (risco de dado sensível em log).
- **Dependências:** TASK-001 (pode rodar em paralelo com TASK-002 a TASK-005, mas precisa do esqueleto do endpoint pronto).
- **Estimativa:** P

## TASK-007 — Testes de integração end-to-end do endpoint
- **Descrição:** teste cobrindo o fluxo completo, mockando Azure AI Search e Azure OpenAI.
- **Critérios de aceite:**
  - Cobre o caminho feliz (pergunta com chunks relevantes disponíveis).
  - Cobre pergunta sem chunks relevantes — deve responder "não encontrado", nunca inventar (guardrail herdado do Cenário 1).
  - Cobre timeout do modelo de geração (TASK-005) e retorno de 503.
- **Dependências:** TASK-001 a TASK-005.
- **Estimativa:** M
