import { z } from "zod";

export const taskStatusSchema = z.enum(["backlog", "active", "blocked", "done"]);

export const taskPrioritySchema = z.enum(["low", "normal", "high"]);

export const taskCreateInputSchema = z.object({
  taskId: z.string().min(1, "taskId is required"),
  title: z.string().trim().min(1, "title is required"),
  notes: z.string().nullable().optional(),
  priority: taskPrioritySchema.optional(),
  dueAt: z.string().nullable().optional(),
});

export const taskEditInputSchema = z
  .object({
    taskId: z.string().min(1, "taskId is required"),
    title: z.string().trim().min(1, "title is required").optional(),
    notes: z.string().nullable().optional(),
    priority: taskPrioritySchema.optional(),
    dueAt: z.string().nullable().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.notes !== undefined ||
      value.priority !== undefined ||
      value.dueAt !== undefined,
    "task edit requires at least one field to change",
  );

export const taskSetStatusInputSchema = z.object({
  taskId: z.string().min(1, "taskId is required"),
  status: taskStatusSchema,
});
