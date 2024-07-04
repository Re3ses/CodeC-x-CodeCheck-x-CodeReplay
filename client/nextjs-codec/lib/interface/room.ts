import { EnrolleeSchema } from './enrollee';
import { z } from 'zod';
import { ProblemSchema } from './problem';

export const RoomSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.string(),
  enrollees: z.array(EnrolleeSchema),
  problems: z.array(ProblemSchema),
  is_locked: z.boolean(),
  is_archived: z.boolean(),
  mentor: z.object({
    first_name: z.string(),
    last_name: z.string(),
  }),
  code: z.string(),
  date_created: z.string(),
  slug: z.string(),
  id: z.string(),
});

export type RoomSchemaInferredType = z.infer<typeof RoomSchema>;
