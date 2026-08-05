import { describe, it, expect } from "vitest";
import { validateStructuredResponse } from "../src/services/response-validator";
import { NAO_ENCONTRADO } from "../src/schemas/structured-response-schema";

describe("response-validator — schema (structured output)", () => {
  it("aceita uma resposta válida e completa", () => {
    const result = validateStructuredResponse({
      answer: "O prazo de devolução é de 7 dias úteis.",
      source_document: "POL-001",
      confidence_score: "alta",
    });
    expect(result.ok).toBe(true);
  });

  it("rejeita quando falta source_document", () => {
    const result = validateStructuredResponse({
      answer: "O prazo de devolução é de 7 dias úteis.",
      confidence_score: "alta",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("schema_invalid");
    expect(result.response.source_document).toBe(NAO_ENCONTRADO);
  });

  it("rejeita confidence_score fora do enum esperado", () => {
    const result = validateStructuredResponse({
      answer: "O prazo de devolução é de 7 dias úteis.",
      source_document: "POL-001",
      confidence_score: "muito alta",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("schema_invalid");
  });

  it("rejeita campos extras não previstos no schema (schema estrito)", () => {
    const result = validateStructuredResponse({
      answer: "O prazo de devolução é de 7 dias úteis.",
      source_document: "POL-001",
      confidence_score: "alta",
      internal_debug_notes: "modelo hesitou entre duas respostas",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("schema_invalid");
  });

  it("aceita 'não encontrei' como resposta legítima, usando o sentinela NAO_ENCONTRADO", () => {
    const result = validateStructuredResponse({
      answer: "Não encontrei essa informação na documentação. Recomendo escalar para o supervisor.",
      source_document: NAO_ENCONTRADO,
      confidence_score: "baixa",
    });
    expect(result.ok).toBe(true);
  });
});

describe("response-validator — guardrail: carga perigosa + devolução", () => {
  it("aprova quando a resposta nega corretamente a devolução de carga perigosa", () => {
    const result = validateStructuredResponse({
      answer:
        "Não é possível devolver carga perigosa pelo processo padrão. Recomendo escalar para o supervisor.",
      source_document: "POL-001",
      confidence_score: "alta",
    });
    expect(result.ok).toBe(true);
  });

  it("bloqueia quando a resposta afirma que a devolução de carga perigosa é possível", () => {
    const result = validateStructuredResponse({
      answer: "Sim, carga perigosa pode ser devolvida normalmente em até 7 dias úteis.",
      source_document: "POL-001",
      confidence_score: "alta",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("guardrail_dangerous_cargo_return");
  });

  it("bloqueia quando a resposta menciona os dois termos sem nenhuma negação", () => {
    const result = validateStructuredResponse({
      answer: "Carga perigosa e devolução seguem o mesmo prazo padrão de 7 dias.",
      source_document: "POL-001",
      confidence_score: "media",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("guardrail_dangerous_cargo_return");
  });

  it("não aciona o guardrail quando o tema não é mencionado", () => {
    const result = validateStructuredResponse({
      answer: "O cliente Gold tem SLA de resolução em até 24 horas.",
      source_document: "SLA-2024",
      confidence_score: "alta",
    });
    expect(result.ok).toBe(true);
  });
});
