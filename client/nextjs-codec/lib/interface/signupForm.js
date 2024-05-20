import { z } from "zod"

export const FormSchema = z
  .object({
    emailAddress: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    username: z.string(),
    userType: z.enum(["Learner", "Mentor"]),
    password: z.string().min(8),
    passwordConfirm: z.string()
  })
  .refine(data => data.password === data.passwordConfirm, {
    message: "Password must match",
    path: ["passwordConfirm"]
  })

