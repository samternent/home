import type { RunTaskUserCreateInput } from "@/modules/run/services/useRunTaskActions";
import type { AppShellAddDialogSchema } from "@/modules/ui/useAppShellAddDialogModel";

export function createTaskUserDialogSchema(): AppShellAddDialogSchema<RunTaskUserCreateInput> {
  return {
    id: "tasks.user.create",
    title: "Add user",
    description: "Import an identity document and copy it into this ledger as a local user record. Tasks and permissions can reference it without depending on any other ledger.",
    submitLabel: "Add user",
    fields: [
      {
        key: "name",
        label: "Name",
        component: "text",
        placeholder: "Sam Ternent",
        required: true,
        width: "full",
      },
      {
        key: "serializedIdentity",
        label: "Identity document",
        component: "textarea",
        placeholder: "{\n  \"format\": \"ternent-identity\",\n  \"version\": \"2\",\n  ...\n}",
        description: "Paste a serialized identity document. The ledger stores the public identity and derived recipient locally.",
        rows: 8,
        width: "full",
        required: true,
      },
    ],
    map(values) {
      const name = values.name?.trim() ?? "";
      if (!name) {
        throw new Error("User name is required.");
      }

      const serializedIdentity = values.serializedIdentity?.trim() ?? "";
      if (!serializedIdentity) {
        throw new Error("Identity document is required.");
      }

      return {
        name,
        serializedIdentity,
      };
    },
  };
}
