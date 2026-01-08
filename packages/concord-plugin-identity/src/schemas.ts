import { z } from "zod";

export const identityUpsertPayloadSchema = z.object({
  principalId: z.string().min(1),
  displayName: z.string().optional(),
  ageRecipients: z.array(z.string().min(1)).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export type IdentityUpsertPayload = z.infer<
  typeof identityUpsertPayloadSchema
>;
