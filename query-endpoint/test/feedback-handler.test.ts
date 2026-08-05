import { describe, it, expect, vi } from "vitest";
import type { HttpRequest, InvocationContext } from "@azure/functions";
import type { Container } from "@azure/cosmos";
import { createFeedbackHandler } from "../src/functions/feedback/handler";

function makeRequest(body: unknown): HttpRequest {
  return { json: async () => body } as unknown as HttpRequest;
}

function makeContext(): InvocationContext {
  return {} as unknown as InvocationContext;
}

function makeMockContainer(createImpl?: (item: unknown) => Promise<unknown>) {
  const create = vi.fn(createImpl ?? (async (item: unknown) => ({ resource: item })));
  return { items: { create } } as unknown as Container;
}

const VALID_FEEDBACK = {
  queryId: "q1",
  rating: 5,
  comment: "Ótima resposta",
  attendantEmail: "atendente@novatech.com.br",
};

describe("feedback handler", () => {
  it("persiste feedback válido e retorna 200", async () => {
    const container = makeMockContainer();
    const handler = createFeedbackHandler(container);

    const res = await handler(makeRequest(VALID_FEEDBACK), makeContext());

    expect(res.status).toBe(200);
    expect((container.items.create as any)).toHaveBeenCalledTimes(1);
    const persisted = (container.items.create as any).mock.calls[0][0];
    expect(persisted.queryId).toBe("q1");
    expect(persisted.timestamp).toBeTypeOf("string");
  });

  it("rejeita rating fora do intervalo 1-5", async () => {
    const container = makeMockContainer();
    const handler = createFeedbackHandler(container);

    const res = await handler(
      makeRequest({ ...VALID_FEEDBACK, rating: 9 }),
      makeContext()
    );

    expect(res.status).toBe(400);
    expect((container.items.create as any)).not.toHaveBeenCalled();
  });

  it("rejeita attendantEmail que não é um e-mail válido", async () => {
    const container = makeMockContainer();
    const handler = createFeedbackHandler(container);

    const res = await handler(
      makeRequest({ ...VALID_FEEDBACK, attendantEmail: "não-é-email" }),
      makeContext()
    );

    expect(res.status).toBe(400);
  });

  it("rejeita campos extras não previstos (schema estrito)", async () => {
    const container = makeMockContainer();
    const handler = createFeedbackHandler(container);

    const res = await handler(
      makeRequest({ ...VALID_FEEDBACK, debugFlag: true }),
      makeContext()
    );

    expect(res.status).toBe(400);
  });

  it("retorna 503 (não 500 cru) quando a persistência falha", async () => {
    const container = makeMockContainer(async () => {
      throw new Error("Cosmos indisponível");
    });
    const handler = createFeedbackHandler(container);

    const res = await handler(makeRequest(VALID_FEEDBACK), makeContext());

    expect(res.status).toBe(503);
    expect((res.jsonBody as any).error).toBe("upstream_unavailable");
  });

  it("nunca loga attendantEmail nem comment (dado pessoal) — só metadados", async () => {
    const container = makeMockContainer();
    const logger = { info: vi.fn(), error: vi.fn() };
    const handler = createFeedbackHandler(container, logger);

    await handler(makeRequest(VALID_FEEDBACK), makeContext());

    const allLogCalls = [...logger.info.mock.calls, ...logger.error.mock.calls];
    const serializedLogs = JSON.stringify(allLogCalls);
    expect(serializedLogs).not.toContain(VALID_FEEDBACK.attendantEmail);
    expect(serializedLogs).not.toContain(VALID_FEEDBACK.comment);
  });

  it("também não loga attendantEmail no caminho de erro (persistência falhou)", async () => {
    const container = makeMockContainer(async () => {
      throw new Error("Cosmos indisponível");
    });
    const logger = { info: vi.fn(), error: vi.fn() };
    const handler = createFeedbackHandler(container, logger);

    await handler(makeRequest(VALID_FEEDBACK), makeContext());

    const serializedLogs = JSON.stringify(logger.error.mock.calls);
    expect(serializedLogs).not.toContain(VALID_FEEDBACK.attendantEmail);
  });
});
