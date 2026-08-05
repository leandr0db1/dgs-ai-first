import { describe, it, expect, vi } from "vitest";
import type { HttpRequest, InvocationContext } from "@azure/functions";
import { query } from "../src/functions/query";

function makeRequest(body: unknown): HttpRequest {
  return { json: async () => body } as unknown as HttpRequest;
}

function makeInvalidJsonRequest(): HttpRequest {
  return {
    json: async () => {
      throw new SyntaxError("bad json");
    },
  } as unknown as HttpRequest;
}

function makeContext(): InvocationContext {
  return { log: vi.fn() } as unknown as InvocationContext;
}

describe("query endpoint - validação de input (TASK-001)", () => {
  it("rejeita corpo sem 'question'", async () => {
    const res = await query(makeRequest({}), makeContext());
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).error).toBe("validation_error");
  });

  it("rejeita 'question' vazia (só espaços)", async () => {
    const res = await query(makeRequest({ question: "   " }), makeContext());
    expect(res.status).toBe(400);
  });

  it("rejeita clientTier fora do enum (ex.: 'Platinum', que não existe)", async () => {
    const res = await query(
      makeRequest({ question: "Qual o prazo?", clientTier: "Platinum" }),
      makeContext()
    );
    expect(res.status).toBe(400);
  });

  it("rejeita sessionId que não é UUID", async () => {
    const res = await query(
      makeRequest({ question: "Qual o prazo?", sessionId: "abc123" }),
      makeContext()
    );
    expect(res.status).toBe(400);
  });

  it("rejeita corpo que não é JSON válido", async () => {
    const res = await query(makeInvalidJsonRequest(), makeContext());
    expect(res.status).toBe(400);
    expect((res.jsonBody as any).error).toBe("invalid_json");
  });

  it("aceita requisição válida e retorna 501 (próximas tasks ainda não implementadas)", async () => {
    const res = await query(
      makeRequest({ question: "Qual o prazo de devolução?" }),
      makeContext()
    );
    expect(res.status).toBe(501);
    expect((res.jsonBody as any).error).toBe("not_implemented");
  });
});
