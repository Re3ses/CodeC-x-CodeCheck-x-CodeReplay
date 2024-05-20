import { LearnerShema } from "./learner"
import { z } from 'zod'

export const EnrolleeSchema = z.object({
  // badges: z.array(), // array of badges object
  learner: LearnerShema,
  multiplier: z.string(),
  points: z.number(),
  streak: z.object({
    current: z.number(),
    highest: z.number()
  }),
  _id: z.string()
})

export type EnrolleeSchemaInferredType = z.infer<typeof EnrolleeSchema>