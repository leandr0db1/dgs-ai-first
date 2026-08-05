import { z } from "zod";

export const QueryRequestSchema = z.object({
  question: z
    .string({ required_error: "O campo 'question' é obrigatório." })
    .trim()
    .min(1, "A pergunta não pode estar vazia.")
    .max(1000, "A pergunta excede o tamanho máximo de 1000 caracteres."),
  clientTier: z.enum(["Gold", "Silver", "Standard"]).optional(),
  sessionId: z.string().uuid("sessionId deve ser um UUID válido.").optional(),
});

export type QueryRequest = z.infer<typeof QueryRequestSchema>;
