import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  username: z.string(),
  type: z.enum(['Learner', 'Mentor']),
  password: z.string().min(8),
});

export type RegisterSchemaInferredType = z.infer<typeof RegisterSchema>;
