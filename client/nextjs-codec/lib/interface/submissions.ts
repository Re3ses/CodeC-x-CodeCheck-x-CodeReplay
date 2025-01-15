import { z } from 'zod';

export const SubmissionSchema = z.object({
  _id: z.string(),
  language_used: z.string(),
  code: z.string(),
  history: z.array(z.string()),
  score: z.number(),
  score_overall_count: z.number(),
  verdict: z.string(),
  learner: z.string(),
  learner_id: z.string(),
  problem: z.string(),
  room: z.string(),
  attempt_count: z.number(),
  start_time: z.number(),
  end_time: z.number(),
  completion_time: z.number(),
  most_similar: z.string().nullable(),
  submission_date: z.string(),
  __v: z.number(),
});

export type SubmissionSchemaInferredType = z.infer<typeof SubmissionSchema>;