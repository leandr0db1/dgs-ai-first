import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient, Container } from "@azure/cosmos";
import pino, { Logger } from "pino";
import { FeedbackRequestSchema } from "../../schemas/feedback-schema";

const defaultLogger = pino({ name: "feedback-handler" });

let cachedContainer: Container | undefined;

function getFeedbackContainer(): Container {
  if (!cachedContainer) {
    const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING as string);
    cachedContainer = client.database("novatech").container("feedbacks");
  }
  return cachedContainer;
}

/**
 * Fábrica do handler, para permitir injetar um container e um logger (mocks)
 * nos testes — sem depender de uma conexão real com o Cosmos DB, de
 * variáveis de ambiente, ou de inspecionar a saída real do pino. Em
 * produção, `app.http` abaixo chama sem argumentos: o container real só é
 * resolvido na primeira requisição (nunca no import do módulo) e reutilizado
 * nas seguintes, e o logger real é o pino configurado no topo do arquivo.
 */
export function createFeedbackHandler(
  injectedContainer?: Container,
  injectedLogger: Pick<Logger, "info" | "error"> = defaultLogger
) {
  const logger = injectedLogger;
  return async function feedbackHandler(
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

    const parsed = FeedbackRequestSchema.safeParse(body);
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

    const feedback = { ...parsed.data, timestamp: new Date().toISOString() };

    // Nunca logar attendantEmail nem comment (dado pessoal / texto livre do
    // atendente) — só metadados que identificam o evento, não o conteúdo.
    logger.info(
      { queryId: feedback.queryId, rating: feedback.rating },
      "feedback_received"
    );

    const container = injectedContainer ?? getFeedbackContainer();
    try {
      await container.items.create(feedback);
    } catch (err) {
      logger.error({ queryId: feedback.queryId, err }, "feedback_persist_failed");
      return {
        status: 503,
        jsonBody: {
          error: "upstream_unavailable",
          message: "Não foi possível registrar o feedback no momento. Tente novamente.",
        },
      };
    }

    return { status: 200, jsonBody: { status: "ok" } };
  };
}

app.http("feedback", {
  methods: ["POST"],
  authLevel: "function",
  route: "feedback",
  handler: createFeedbackHandler(),
});
