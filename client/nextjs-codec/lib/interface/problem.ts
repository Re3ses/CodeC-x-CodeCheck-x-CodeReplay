import { z } from 'zod';

export const ProblemSchema = z.object({
  name: z.string().min(8),
  description: z.string().min(8),
  input_format: z.string(),
  output_format: z.string(),
  constraints: z.string(),
  release: z.date(),
  deadline: z.date(),
  languages: z.array(
    z.object({
      name: z.string(),
      code_snippet: z.string(),
      time_complexity: z.coerce.number(),
      space_complexity: z.coerce.number(),
    })
  ),
  test_cases: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      is_sample: z.boolean(),
      is_eval: z.boolean(),
      strength: z.coerce.number(),
    })
  ),
  mentor: z.string(),
  code: z.string(),
  slug: z.string(),
});

export type ProblemSchemaInferredType = z.infer<typeof ProblemSchema>;
