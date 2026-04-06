import type { RunTaskPermissionGrantCreateInput } from "@/modules/run/services/useRunTaskActions";
import type { AppShellAddDialogSchema } from "@/modules/ui/useAppShellAddDialogModel";
import type { TaskPermissionRecord } from "./types";

export type TaskPermissionGrantMemberOption = {
  userId: string;
  name: string;
};

type CreateTaskPermissionGrantDialogOptions = {
  permission: TaskPermissionRecord;
  members: TaskPermissionGrantMemberOption[];
};

export function createTaskPermissionGrantDialogSchema(
  options: CreateTaskPermissionGrantDialogOptions,
): AppShellAddDialogSchema<RunTaskPermissionGrantCreateInput> {
  return {
    id: `tasks.permission.grant.${options.permission.permissionId}`,
    title: "Grant permission",
    description: `Add a local identity to ${options.permission.title}. The permission key is wrapped for that identity and stored in this ledger.`,
    submitLabel: "Add grant",
    fields: [
      {
        key: "userId",
        label: "Identity",
        component: "select",
        width: "full",
        defaultValue: "",
        options: [
          { label: "Select an identity", value: "" },
          ...options.members.map((member) => ({
            label: member.name,
            value: member.userId,
          })),
        ],
      },
    ],
    map(values) {
      const userId = values.userId?.trim() ?? "";
      if (!userId) {
        throw new Error("Select a local identity.");
      }

      return {
        permissionId: options.permission.permissionId,
        userId,
      };
    },
  };
}
