import { z } from "zod";

export const capSchema = z.enum(["read", "write", "grant", "admin"]);

export const targetSchema = z.object({
  type: z.enum(["principal", "group"]),
  id: z.string().min(1),
});

export const groupUpsertPayloadSchema = z.object({
  groupId: z.string().min(1),
  displayName: z.string().optional(),
});

export const groupMemberPayloadSchema = z.object({
  groupId: z.string().min(1),
  principalId: z.string().min(1),
});

export const permGrantPayloadSchema = z.object({
  scope: z.string().min(1),
  cap: capSchema,
  target: targetSchema,
  constraints: z
    .object({
      expires: z.string().datetime().optional(),
      note: z.string().optional(),
    })
    .optional(),
});

export const permRevokePayloadSchema = z.object({
  scope: z.string().min(1),
  cap: capSchema,
  target: targetSchema,
  reason: z.string().optional(),
});

export type Cap = z.infer<typeof capSchema>;
export type Target = z.infer<typeof targetSchema>;
export type GroupUpsertPayload = z.infer<typeof groupUpsertPayloadSchema>;
export type GroupMemberPayload = z.infer<typeof groupMemberPayloadSchema>;
export type PermGrantPayload = z.infer<typeof permGrantPayloadSchema>;
export type PermRevokePayload = z.infer<typeof permRevokePayloadSchema>;
