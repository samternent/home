import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import { toDidKeyFromPublicKey } from "@/app/plugins/identityKey";
import {
  configureAppApiSingletonForTests,
  resetAppApiSingletonForTests,
  useAppApi,
} from "@/app/api";
import { useEntityDetailsPanel } from "@/runtime/entities";
import RuntimeAppsTaskList from "@/runtime/apps/tasks/list/RuntimeAppsTaskList.vue";

async function waitFor(check: () => boolean): Promise<boolean> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    await flushPromises();
    if (check()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  return false;
}

describe("RuntimeAppsTaskList", () => {
  beforeEach(async () => {
    await resetAppApiSingletonForTests();
    configureAppApiSingletonForTests({
      identity: await createIdentity("2026-05-01T10:00:00.000Z"),
    });
    useEntityDetailsPanel().close();
  });

  it("opens create drawer and removes inline task-create form", async () => {
    const wrapper = mount(RuntimeAppsTaskList);

    const rendered = await waitFor(() =>
      wrapper.find('[data-test="runtime-task-list-v1"]').exists(),
    );
    expect(rendered).toBe(true);
    const railClass = wrapper.get('[data-test="runtime-task-layout-rail"]').attributes("class");
    expect(railClass).toMatchInlineSnapshot(
      "\"hidden w-64 shrink-0 overflow-auto border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 lg:block\"",
    );
    expect(wrapper.get('[data-test="runtime-task-layout-scroll"]').classes()).toContain(
      "overflow-auto",
    );
    expect(wrapper.get('[data-test="runtime-task-layout-table-head"]').classes()).toContain(
      "sticky",
    );

    expect(wrapper.find('[data-test="runtime-task-list-create-title"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="runtime-task-list-open-create"]').exists()).toBe(true);

    await wrapper.get('[data-test="runtime-task-list-open-create"]').trigger("click");

    const panel = useEntityDetailsPanel();
    expect(panel.isOpen.value).toBe(true);
    expect(panel.activeConfig.value?.mode).toBe("create");
    expect(
      panel.activeConfig.value?.schema.fields.some((field) => field.id === "scope" && field.kind === "select"),
    ).toBe(true);
  });

  it("stages edit diffs and archive from drawer", async () => {
    const appApi = useAppApi();
    await appApi.load();
    await appApi.identity.ensureActiveIdentity();

    const memberIdentity = await createIdentity("2026-05-01T11:00:00.000Z");
    const memberIdentityKey = toDidKeyFromPublicKey(memberIdentity.publicKey);

    await appApi.users.create({ identityKey: memberIdentityKey });
    await appApi.tasks.create({
      title: "Original task",
      audienceType: "everyone",
      audienceId: null,
      assigneeIdentityKey: null,
    });

    const boardId = appApi.tasks.defaultBoardId();
    const task = appApi.tasks.byBoard(boardId).at(0);
    expect(task).toBeTruthy();

    const targetColumnId = appApi.tasks.boardColumns(boardId).at(1)?.id;
    expect(targetColumnId).toBeTruthy();

    const wrapper = mount(RuntimeAppsTaskList);
    const ready = await waitFor(() =>
      wrapper.find(`[data-test="runtime-task-list-open-edit-${task!.id}"]`).exists(),
    );
    expect(ready).toBe(true);

    await wrapper
      .get(`[data-test="runtime-task-list-open-edit-${task!.id}"]`)
      .trigger("click");

    const panel = useEntityDetailsPanel();
    expect(panel.activeConfig.value?.mode).toBe("edit");

    panel.setFieldValue("title", "Updated task title");
    panel.setFieldValue("assigneeIdentityKey", memberIdentityKey);
    panel.setFieldValue("columnId", targetColumnId!);

    const submitted = await panel.submit();
    expect(submitted).toBe(true);

    const updatedTask = appApi.tasks.byId(task!.id);
    expect(updatedTask?.title).toBe("Updated task title");
    expect(updatedTask?.assigneeIdentityKey).toBe(memberIdentityKey);
    expect(updatedTask?.columnId).toBe(targetColumnId);

    await wrapper
      .get(`[data-test="runtime-task-list-open-edit-${task!.id}"]`)
      .trigger("click");

    panel.setFieldValue("status", "archived");

    const archived = await panel.submit();
    expect(archived).toBe(true);

    expect(appApi.tasks.byId(task!.id)).toBeNull();
  });

  it("filters task rail items for private/shared/unassigned", async () => {
    const appApi = useAppApi();
    await appApi.load();
    await appApi.identity.ensureActiveIdentity();

    await appApi.permissions.create({ title: "Admin" });
    const permissionId = appApi.permissions.all()[0]?.id;
    expect(permissionId).toBeTruthy();

    await appApi.tasks.create({
      title: "Private task",
      audienceType: "permission",
      audienceId: permissionId!,
      assigneeIdentityKey: null,
    });

    await appApi.tasks.create({
      title: "Shared task",
      audienceType: "everyone",
      audienceId: null,
      assigneeIdentityKey: null,
    });

    const wrapper = mount(RuntimeAppsTaskList);
    const rendered = await waitFor(() =>
      wrapper.find('[data-test="runtime-task-filter-private"]').exists(),
    );
    expect(rendered).toBe(true);

    expect(wrapper.get('[data-test="runtime-task-filter-private"]').text()).toContain("1");
    expect(wrapper.get('[data-test="runtime-task-filter-shared"]').text()).toContain("1");
    expect(wrapper.get('[data-test="runtime-task-filter-unassigned"]').text()).toContain("2");

    await wrapper.get('[data-test="runtime-task-filter-private"]').trigger("click");
    await flushPromises();
    expect(wrapper.findAll('[data-test^="runtime-task-list-open-edit-"]')).toHaveLength(1);

    await wrapper.get('[data-test="runtime-task-filter-shared"]').trigger("click");
    await flushPromises();
    expect(wrapper.findAll('[data-test^="runtime-task-list-open-edit-"]')).toHaveLength(1);
  });
});
