import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string().min(8),
});

export type LoginShemaInferredType = z.infer<typeof LoginSchema>;
