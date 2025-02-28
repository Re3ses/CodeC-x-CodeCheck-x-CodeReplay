import { z } from "zod";

export const ClassroomSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["Competitive", "Cooperative"]),
  releaseDate: z.date({
    required_error: "Release date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  })
}).refine((data) => data.dueDate > data.releaseDate, {
  message: "Due date must be after release date",
  path: ["dueDate"],
});

export type ClassroomShemaInferredType = z.infer<typeof ClassroomSchema>;