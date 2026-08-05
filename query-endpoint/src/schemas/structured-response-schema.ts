import { z } from "zod";

/**
 * Sentinela usada quando o assistente corretamente não encontrou uma resposta
 * na base documental. Existe para que "sem fonte" continue sendo uma resposta
 * válida (guardrail do Cenário 1: dizer "não encontrei" em vez de inventar),
 * sem abrir uma exceção no schema que permitiria o campo ficar vazio/ausente
 * por engano em qualquer outro caso.
 */
export const NAO_ENCONTRADO = "NAO_ENCONTRADO" as const;

export const StructuredResponseSchema = z
  .object({
    answer: z.string().min(1, "O campo 'answer' não pode estar vazio."),
    source_document: z
      .string()
      .min(1, "O campo 'source_document' é obrigatório — use 'NAO_ENCONTRADO' quando não houver fonte aplicável."),
    confidence_score: z.enum(["alta", "media", "baixa"], {
      errorMap: () => ({
        message: "confidence_score deve ser 'alta', 'media' ou 'baixa'.",
      }),
    }),
  })
  .strict();

export type StructuredResponse = z.infer<typeof StructuredResponseSchema>;
