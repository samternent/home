import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RecordListItem } from "./RecordList.types";
import { resolveRecordListSecondaryText } from "./RecordList.utils";

describe("RecordList", () => {
  it("resolves row secondary text from meta then description", () => {
    const withMeta: RecordListItem = {
      id: "one",
      title: "One",
      meta: "1 member",
      description: "fallback",
    };

    const withDescription: RecordListItem = {
      id: "two",
      title: "Two",
      description: "Description only",
    };

    const withNone: RecordListItem = {
      id: "three",
      title: "Three",
    };

    expect(resolveRecordListSecondaryText(withMeta)).toBe("1 member");
    expect(resolveRecordListSecondaryText(withDescription)).toBe("Description only");
    expect(resolveRecordListSecondaryText(withNone)).toBeNull();
  });

  it("declares item-action slot and empty-state affordance", () => {
    const source = readFileSync(resolve(process.cwd(), "src/patterns/RecordList/RecordList.vue"), "utf8");

    expect(source).toContain('<slot name="item-leading" :item="item" />');
    expect(source).toContain('<slot name="item-action" :item="item">');
    expect(source).toContain('data-test="record-list-empty"');
  });
});
