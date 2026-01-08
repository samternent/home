import { z } from "zod";

export const encryptedPayloadSchema = z.object({
  enc: z.literal("age"),
  scope: z.string().min(1),
  epoch: z.number().int().min(1),
  ct: z.string().min(1),
});

export const wrapSchema = z.object({
  to: z.array(z.string().min(1)).min(1),
  ct: z.string().min(1),
});

export const epochWrapSchema = z.object({
  principalId: z.string().min(1),
  epoch: z.number().int().min(1),
  wrap: wrapSchema,
});

export const encEpochRotatePayloadSchema = z.object({
  scope: z.string().min(1),
  newEpoch: z.number().int().min(1),
  wraps: z.array(epochWrapSchema),
  note: z.string().optional(),
});

export const encWrapPublishPayloadSchema = z.object({
  scope: z.string().min(1),
  epoch: z.number().int().min(1),
  principalId: z.string().min(1),
  wrap: wrapSchema,
});

export type EncryptedPayload = z.infer<typeof encryptedPayloadSchema>;
export type WrapPayload = z.infer<typeof wrapSchema>;
export type EpochWrapPayload = z.infer<typeof epochWrapSchema>;
export type EncEpochRotatePayload = z.infer<typeof encEpochRotatePayloadSchema>;
export type EncWrapPublishPayload = z.infer<typeof encWrapPublishPayloadSchema>;
