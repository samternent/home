export type RuntimeReplayPhase = "system" | "workspace";

export type RuntimeReplayReason =
  | "load"
  | "command"
  | "commit"
  | "discard"
  | "import"
  | "storage-pull"
  | "manual";

export type RuntimeReplayOptions = {
  reason: RuntimeReplayReason;
  fromEntryId?: string;
  toEntryId?: string;
};

export type RuntimeReplayResult = {
  committedEntryCount: number;
  stagedEntryCount: number;
  phases: RuntimeReplayPhase[];
};

export type RuntimeReplayPipeline = {
  replay(options: RuntimeReplayOptions): Promise<RuntimeReplayResult>;
};
