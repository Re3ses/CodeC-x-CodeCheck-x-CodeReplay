import { z } from 'zod';

export const ClassroomSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(256),
  type: z.enum(['Competitive', 'Cooperative']),
});

export type ClassroomShemaInferredType = z.infer<typeof ClassroomSchema>;
