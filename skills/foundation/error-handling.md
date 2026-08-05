# Skill: Error Handling (Foundation)

**Ativação:** usar sempre que gerar ou revisar código que trate erros, exceções, ou respostas de falha em qualquer endpoint ou função do projeto `novatech-assistant`.

## Contexto

Este projeto é um assistente de RAG com várias dependências externas que podem falhar de formas diferentes: geração de embedding (Azure OpenAI), busca vetorial (Azure AI Search), geração de resposta (GPT-4o), e a própria validação de entrada. Sem um contrato único de erro, cada endpoint acaba inventando seu próprio formato — o que quebra o bot do Teams e o painel web, que precisam tratar erros de forma previsível independente de qual endpoint responder.

## Regras prescritivas

1. Todo erro retornado por um endpoint HTTP é um JSON no formato `{ error: string, message: string, details?: object }`, onde `error` é um código estável em `snake_case` (para o cliente decidir programaticamente o que fazer) e `message` é a mensagem legível em português.
2. Nenhuma exceção não tratada deve chegar ao topo do handler HTTP. Toda chamada a uma dependência externa (embedding, busca, geração) deve ser envolvida e convertida para um erro tipado do domínio antes de subir.
3. Mapeamento de status HTTP:
   - `400` — erro de validação de entrada (`validation_error`, `invalid_json`).
   - `404` — recurso referenciado não existe (ex.: `sessionId` de uma sessão inexistente).
   - `503` — dependência externa indisponível, **depois de esgotar a política de retry** (`upstream_unavailable`).
   - `500` — reservado para bugs realmente inesperados. Nunca usado deliberadamente para um caso de erro já conhecido/mapeado.
4. Toda chamada a uma dependência externa usa retry com backoff exponencial antes de propagar uma falha — nunca propaga no primeiro erro transitório.
5. Mensagens e logs de erro nunca incluem o conteúdo da pergunta do cliente nem o texto dos chunks recuperados — só metadados (nome do campo inválido, código do erro, correlationId).
6. Uma falha de infraestrutura **nunca** é mascarada como uma resposta válida do assistente (ex.: nunca retornar 200 com `"não sei"` quando na verdade o Azure OpenAI caiu) — isso impede o time de distinguir telemetria de "sem resposta na base" de "serviço fora do ar".

## Exemplos

### Validação de entrada

**DO:**
```ts
if (!parsed.success) {
  return {
    status: 400,
    jsonBody: {
      error: "validation_error",
      message: "A requisição não passou na validação.",
      details: parsed.error.flatten().fieldErrors,
    },
  };
}
```

**DON'T:**
```ts
// Lança uma exceção genérica: derruba a function com um 500 não intencional,
// e o log acaba incluindo o valor bruto enviado pelo cliente.
if (!parsed.success) {
  throw new Error("bad input: " + JSON.stringify(parsed.error));
}
```

### Falha de dependência externa

**DO:**
```ts
try {
  return await callAzureOpenAIWithRetry(prompt);
} catch (err) {
  if (err instanceof UpstreamTimeoutError) {
    return {
      status: 503,
      jsonBody: {
        error: "upstream_unavailable",
        message: "O serviço de geração está indisponível no momento. Tente novamente em instantes.",
      },
    };
  }
  throw err; // erro realmente inesperado -> 500, vira alerta para investigação
}
```

**DON'T:**
```ts
// Engole o erro e finge que o assistente "não sabe" — mascara uma queda de
// infraestrutura como se fosse um comportamento normal do RAG.
try {
  return await callAzureOpenAIWithRetry(prompt);
} catch (err) {
  return { status: 200, jsonBody: { answer: "Desculpe, não sei.", sources: [] } };
}
```

## Anti-padrões (o que o Copilot gera sem esta skill)

- **`throw new Error(string)` genérico para qualquer validação falha** — é o padrão mais comum nos dados de treinamento de código, mas produz um formato de erro diferente em cada endpoint do projeto.
- **Usar 500 como "catch-all" para "não encontrado"** — mais fácil de gerar do que decidir entre 404 e 503, mas esconde de quem consome a API se o problema é "não existe" ou "bug".
- **`catch` que retorna sucesso com corpo vazio/genérico só para o teste passar** — comum quando o Copilot está tentando fazer um teste ficar verde rapidamente; esconde exatamente o tipo de falha que este projeto mais precisa detectar (infraestrutura vs. "sem resposta na documentação").
