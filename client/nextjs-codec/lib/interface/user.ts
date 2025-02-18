import { z } from 'zod';

export const UserSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  username: z.string(),
  type: z.string(),
  _id: z.string(),
});

export type UserSchemaInferredType = z.infer<typeof UserSchema>;
