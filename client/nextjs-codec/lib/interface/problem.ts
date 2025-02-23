import { z } from 'zod';

export const ProblemSchema = z.object({
  _id: z.string().optional(),
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
  perfect_score: z.coerce.number(),
});

export type ProblemSchemaInferredType = z.infer<typeof ProblemSchema>;

export interface TestCase {
  input: string;
  output: string;
  score: number;
  is_sample: boolean;
  is_eval: boolean;
  strength: number;
}

export interface Problem {
  _id?: string;
  name: string;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  release: Date;
  deadline: Date;
  languages: {
    name: string;
    code_snippet: string;
    time_complexity: number;
    space_complexity: number;
  }[];
  test_cases: TestCase[];
  mentor: string;
  code: string;
  slug: string;
  perfect_score: number;
}
