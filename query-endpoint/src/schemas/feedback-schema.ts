import { z } from "zod";

export const FeedbackRequestSchema = z
  .object({
    queryId: z.string().min(1, "queryId é obrigatório."),
    rating: z.number().int("rating deve ser um inteiro.").min(1).max(5),
    comment: z.string().max(2000, "comment excede o tamanho máximo.").optional(),
    attendantEmail: z.string().email("attendantEmail deve ser um e-mail válido."),
  })
  .strict();

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
