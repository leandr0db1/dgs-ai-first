# Desenvolvedor — Exercício 3.1: Structured Output e Verificações Determinísticas

Código em [`query-endpoint/src/schemas/structured-response-schema.ts`](query-endpoint/src/schemas/structured-response-schema.ts) e [`query-endpoint/src/services/response-validator.ts`](query-endpoint/src/services/response-validator.ts), seguindo o caminho definido no Anexo C. Testado de verdade: **15/15 testes passando** (`npx vitest run`), `tsc --noEmit` limpo.

## 1. Versão inicial (estilo Copilot) e o que ela erra

Um primeiro passe típico do Copilot para esta task ficaria assim:

```ts
// v1 — schema sem .strict()
export const StructuredResponseSchema = z.object({
  answer: z.string().min(1),
  source_document: z.string().min(1),
  confidence_score: z.number().min(0).max(1),
});

// v1 — guardrail com checagem ingênua de string
function violatesGuardrail(answer: string): boolean {
  const risky = answer.includes("carga perigosa") && answer.includes("devolução");
  return risky && !answer.includes("não");
}
```

## 2. Code review — problemas encontrados

1. **Schema sem `.strict()` aceita campos extras silenciosamente.** Um modelo que "vaza" um campo extra (ex.: `internal_debug_notes`, ou um campo alucinado) passaria despercebido pela validação — o structured output deixa de ser uma garantia de contrato fechado. **Corrigido** com `.strict()` no schema final (testado: `test/response-validator.test.ts`, caso "rejeita campos extras não previstos no schema").

2. **A checagem ingênua de string (`answer.includes("não")`) tem falsos positivos e negativos evidentes.** `"A carga perigosa não impede o rastreamento, mas a devolução é permitida"` contém "não" em qualquer lugar do texto e passaria mesmo afirmando algo perigoso; variações como "não é elegível", "não pode", "são elegíveis" nem são reconhecidas como negação real. Substituí por um par de regex (negação vs. afirmação) com tolerância a variações de "devolução/devolver/devolvida".

3. **Bug real encontrado rodando os testes (não hipotético):** a primeira versão do regex de afirmação (`/(pode|podem|é possível|...)\s+.{0,25}?devolv/i`) **classificava "Não é possível devolver carga perigosa..." como afirmativa**, porque o teste procurava a cláusula de permissão em qualquer lugar do texto, sem checar se ela mesma estava negada por um "não" logo antes. Isso derrubou o teste "aprova quando a resposta nega corretamente" na primeira execução. Corrigido com um lookbehind negativo (`(?<!n[ãa]o\s+)`) que exclui cláusulas de permissão precedidas por negação. Ver comentário no código e o teste que trava esse caso.

4. **Tensão entre "source_document sempre obrigatório" e o guardrail de "dizer que não encontrou" do Cenário 1.** Uma leitura literal do guardrail 1 ("toda resposta DEVE conter `source_document`, senão é rejeitada") bloquearia até a resposta correta "não encontrei essa informação" — que legitimamente não tem fonte. Resolvido com um valor sentinela (`NAO_ENCONTRADO`) que satisfaz "o campo está presente" sem forçar uma fonte inventada. Sem isso, o harness estaria punindo exatamente o comportamento honesto que o resto do projeto tenta incentivar.

5. **(Bônus) `confidence_score` como número 0-1 é inconsistente com o resto do sistema.** Em todos os outros artefatos deste treinamento (Cenário 1, exemplos do Cenário 3 para outros papéis), confiança é tratada como categórica (`Alta`/`Média`/`Baixa`), nunca como um score numérico contínuo. Troquei para `z.enum(["alta", "media", "baixa"])` — mantém consistência com o restante do projeto em vez de introduzir uma escala nova que ninguém mais usa.

## 3. Distinção prompt (probabilístico) vs. código (determinístico)

O prompt (Cenário 1/2) instrui o modelo a citar fonte, não inventar valores, e negar devolução de carga perigosa — mas isso é uma instrução que o modelo pode ignorar sob pressão de contexto ou paráfrase. O `response-validator.ts` é a rede determinística: **não importa o que o prompt disse para o modelo fazer, a resposta só sai do backend se passar pelo schema E pelos dois guardrails de código.** Isso não substitui o prompt (que ainda reduz a chance de uma resposta ruim ser gerada), mas garante que uma falha do prompt não chegue ao atendente sem barreira.

**Limitação registrada, não resolvida neste exercício:** os guardrails de código aqui são regex — determinísticos na execução, mas ainda heurísticos na cobertura. Paráfrases mais distantes (ex.: "está liberada a devolução desse tipo de carga") não seriam pegas por este regex. Isso é esperado para uma primeira camada de harness; o ideal é complementar com testes de regressão (Exercício 3.2 do QA) que ampliem a lista de variações reais observadas em produção.

## 4. Entregável
- `structured-response-schema.ts` (schema Zod estrito).
- `response-validator.ts` (2 guardrails determinísticos).
- `test/response-validator.test.ts` — 9 testes, incluindo o caso que expôs o bug do lookbehind.
- Esta revisão crítica com 5 problemas encontrados e corrigidos (4 exigidos-equivalentes + 1 bônus).
