import armourSuite from "./armour/content";
import concordSuite from "./concord/content";
import ledgerSuite from "./ledger/content";
import sealSuite from "./seal/content";
import type { SuiteDefinition } from "./types";

export const suiteDefinitions: readonly SuiteDefinition[] = [
  armourSuite,
  concordSuite,
  ledgerSuite,
  sealSuite,
] as const;

export const suitesBySlug: Record<string, SuiteDefinition> = Object.fromEntries(
  suiteDefinitions.map((suite) => [suite.slug, suite]),
);
