import { z } from "zod";

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit deve ser pelo menos 1")
    .max(100, "Limit máximo é 100")
    .default(20),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
