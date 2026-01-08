import { z } from "zod";

function isJsonSerializable(value: unknown, seen = new Set<unknown>()): boolean {
  if (value === null) {
    return true;
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (typeof value === "bigint" || typeof value === "symbol") {
    return false;
  }
  if (typeof value === "function" || value === undefined) {
    return false;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return value.every((entry) => isJsonSerializable(entry, seen));
  }
  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return false;
    }
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return Object.values(value as Record<string, unknown>).every((entry) =>
      isJsonSerializable(entry, seen)
    );
  }
  return false;
}

const principalIdSchema = z
  .string({
    required_error: "principalId is required",
    invalid_type_error: "principalId must be a string",
  })
  .min(1, "principalId must be non-empty");

const displayNameSchema = z.string({
  invalid_type_error: "displayName must be a string",
});

const ageRecipientSchema = z
  .string({
    invalid_type_error: "ageRecipients must be non-empty strings",
  })
  .min(1, "ageRecipients must be non-empty strings");

export const identityUpsertPayloadSchema = z.object({
  principalId: principalIdSchema,
  displayName: displayNameSchema.optional(),
  ageRecipients: z
    .array(ageRecipientSchema, {
      invalid_type_error: "ageRecipients must be an array of non-empty strings",
    })
    .optional(),
  metadata: z
    .record(z.unknown(), {
      invalid_type_error: "metadata must be an object",
    })
    .optional()
    .refine((value) => (value ? isJsonSerializable(value) : true), {
      message: "metadata must be JSON-serializable",
    }),
});

export type IdentityUpsertPayload = z.infer<
  typeof identityUpsertPayloadSchema
>;
