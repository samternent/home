import type { RecordListItem } from "./RecordList.types";

export function resolveRecordListSecondaryText(item: RecordListItem): string | null {
  return item.meta ?? item.description ?? null;
}
