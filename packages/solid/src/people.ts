import { createSolidJsonResource } from "./resource.js";
import type {
  ConcordOsPeopleRegistry,
  ConcordOsPerson,
  CreateConcordOsPeopleStorageOptions,
  SolidSessionLike,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPerson(value: unknown): value is ConcordOsPerson {
  return (
    isRecord(value) &&
    typeof value.webId === "string" &&
    (value.label === null || typeof value.label === "string") &&
    (value.note === null || typeof value.note === "string") &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    (value.lastUsedAt === null || typeof value.lastUsedAt === "string")
  );
}

export function isConcordOsPeopleRegistry(value: unknown): value is ConcordOsPeopleRegistry {
  return (
    isRecord(value) &&
    value.format === "ternent-concord-os-people" &&
    value.version === "1" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.people) &&
    value.people.every(isPerson)
  );
}

export function createEmptyConcordOsPeopleRegistry(
  createdAt = new Date().toISOString(),
): ConcordOsPeopleRegistry {
  return {
    format: "ternent-concord-os-people",
    version: "1",
    createdAt,
    updatedAt: createdAt,
    people: [],
  };
}

export function createConcordOsPeopleStorage(
  session: SolidSessionLike,
  url: string,
  options: CreateConcordOsPeopleStorageOptions = {},
) {
  return createSolidJsonResource<ConcordOsPeopleRegistry>({
    session,
    url,
    name: "concord-os-people",
    contentType: options.contentType,
    coerce(value) {
      if (!isConcordOsPeopleRegistry(value)) {
        throw new Error(
          "Concord OS people registry must be a ternent-concord-os-people v1 object.",
        );
      }
      return value;
    },
  });
}
