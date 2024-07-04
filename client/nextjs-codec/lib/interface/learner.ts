import { z } from 'zod';

export const LearnerShema = z.object({
  _id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  profile_iamge: z.string(),
  type: z.string(),
  id: z.string(),
});

export type LearnerShemaInferredType = z.infer<typeof LearnerShema>;
