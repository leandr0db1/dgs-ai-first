import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { QueryRequestSchema } from "../schemas/query-schema";

export async function query(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      status: 400,
      jsonBody: {
        error: "invalid_json",
        message: "O corpo da requisição precisa ser um JSON válido.",
      },
    };
  }

  const parsed = QueryRequestSchema.safeParse(body);
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

  context.log("query recebida e validada", { sessionId: parsed.data.sessionId ?? null });

  // TASK-002 a TASK-005 (embedding, busca no AI Search, montagem de prompt e geração
  // com o GPT-4o) ainda não implementadas. Placeholder até essas tasks serem concluídas.
  return {
    status: 501,
    jsonBody: {
      error: "not_implemented",
      message: "Validação concluída (TASK-001). Geração de resposta depende das TASK-002 a TASK-005.",
    },
  };
}

app.http("query", {
  methods: ["POST"],
  authLevel: "function",
  route: "query",
  handler: query,
});
