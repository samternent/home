import { describe, expect, it } from "vitest";
import { createTaskDialogSchema } from "@/modules/run/tasks/createTaskDialogSchema";
import { createTaskUserDialogSchema } from "@/modules/run/tasks/createTaskUserDialogSchema";

describe("createTaskDialogSchema", () => {
  it("maps selected assignee and permission ids into the task payload", () => {
    const schema = createTaskDialogSchema({
      assignees: [
        {
          userId: "user:1",
          name: "Sam Ternent",
        },
      ],
      permissions: [
        {
          permissionId: "permission:1",
          title: "Maintainers",
          scope: "document",
          createdAt: "2026-03-28T00:00:00.000Z",
          updatedAt: "2026-03-28T00:00:00.000Z",
        },
      ],
    });

    const payload = schema.map({
      title: "Ship alpha",
      assigneeId: "user:1",
      permissionId: "permission:1",
      area: "Core",
      priority: "high",
      dueAt: "",
      tags: "alpha, polish",
      notes: "",
    });

    expect(payload).toMatchObject({
      title: "Ship alpha",
      assigneeId: "user:1",
      assignee: "Sam Ternent",
      permissionId: "permission:1",
      area: "Core",
      priority: "high",
      tags: ["alpha", "polish"],
    });
  });
});

describe("createTaskUserDialogSchema", () => {
  it("requires a serialized identity document", () => {
    const schema = createTaskUserDialogSchema();

    expect(() =>
      schema.map({
        name: "Sam Ternent",
        serializedIdentity: "",
      }),
    ).toThrow("Identity document is required.");
  });
});
