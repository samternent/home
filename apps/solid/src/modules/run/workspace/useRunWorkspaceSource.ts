import {
  useRunSolidStorageProvider,
  type RunSolidStorageProvider,
} from "@/modules/run/storage/providers/solid/useRunSolidStorageProvider";

export type RunWorkspaceSource = RunSolidStorageProvider;

export function useRunWorkspaceSource(): RunWorkspaceSource {
  return useRunSolidStorageProvider();
}
