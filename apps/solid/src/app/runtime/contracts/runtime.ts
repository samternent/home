import type { RuntimeIdentity } from "./identity";
import type { RuntimeReplayPipeline } from "./replay";

export type RuntimeContract = RuntimeReplayPipeline & {
  getIdentity(): RuntimeIdentity | null;
};
