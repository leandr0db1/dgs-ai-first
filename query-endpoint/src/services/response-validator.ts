import pino from "pino";
import {
  NAO_ENCONTRADO,
  StructuredResponse,
  StructuredResponseSchema,
} from "../schemas/structured-response-schema";

const logger = pino({ name: "response-validator" });

export type RejectionReason = "schema_invalid" | "guardrail_dangerous_cargo_return";

export interface ValidationResult {
  ok: boolean;
  response: StructuredResponse;
  reason?: RejectionReason;
}

const SAFE_FALLBACK: StructuredResponse = {
  answer:
    "Não consegui validar esta resposta com segurança. Por favor, escale para o supervisor.",
  source_document: NAO_ENCONTRADO,
  confidence_score: "baixa",
};

// Guardrail 2: "carga perigosa" + "devolução" DEVE conter a negativa.
// Regex tolerante a variações de gênero/número (devolução, devolver, devolvida,
// devolvidas) e a pequena distância entre o verbo e o termo, mas ainda assim é
// uma checagem heurística — ver limitações documentadas em dev-ex3.1-*.md.
const RISKY_CARGO_PATTERN = /carga\s+perigosa/i;
const RETURN_MENTION_PATTERN = /devolv\w*|devolu[cç][aã]o/i;
const NEGATION_PATTERN =
  /n[ãa]o\s+(pode|podem|[ée]\s+poss[ií]vel|s[ãa]o\s+eleg[ií]ve(is)?|[ée]\s+eleg[ií]vel)/i;
// Lookbehind negativo: uma cláusula de permissão ("pode devolver", "é possível
// devolver"...) só conta como afirmação de risco se NÃO estiver ela mesma
// negada por um "não" logo antes (bug real encontrado rodando os testes: sem
// o lookbehind, "Não é possível devolver..." era lida como afirmativa).
const AFFIRMATIVE_RETURN_PATTERN =
  /(?<!n[ãa]o\s+)(pode|podem|[ée]\s+poss[ií]vel|s[ãa]o\s+eleg[ií]ve(is)?)\s+.{0,25}?devolv/i;

function violatesDangerousCargoReturnGuardrail(answer: string): boolean {
  const mentionsDangerousCargo = RISKY_CARGO_PATTERN.test(answer);
  const mentionsReturn = RETURN_MENTION_PATTERN.test(answer);
  if (!mentionsDangerousCargo || !mentionsReturn) {
    return false;
  }

  const hasNegation = NEGATION_PATTERN.test(answer);
  const hasAffirmative = AFFIRMATIVE_RETURN_PATTERN.test(answer);

  // Menciona os dois termos de risco: só passa se houver negação clara E
  // nenhuma afirmação concorrente dizendo que a devolução é possível.
  return !hasNegation || hasAffirmative;
}

export function validateStructuredResponse(raw: unknown): ValidationResult {
  const parsed = StructuredResponseSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(
      { reason: "schema_invalid", issues: parsed.error.flatten() },
      "structured_output_rejected"
    );
    return { ok: false, response: SAFE_FALLBACK, reason: "schema_invalid" };
  }

  const { answer } = parsed.data;
  if (violatesDangerousCargoReturnGuardrail(answer)) {
    logger.warn(
      { reason: "guardrail_dangerous_cargo_return" },
      "structured_output_rejected"
    );
    return {
      ok: false,
      response: SAFE_FALLBACK,
      reason: "guardrail_dangerous_cargo_return",
    };
  }

  return { ok: true, response: parsed.data };
}
