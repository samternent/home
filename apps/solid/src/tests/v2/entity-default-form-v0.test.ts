import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import EntityDefaultForm from "@/runtime/entities/EntityDefaultForm.vue";

describe("EntityDefaultForm", () => {
  it("renders and updates select fields", async () => {
    const wrapper = mount(EntityDefaultForm, {
      props: {
        schema: {
          fields: [
            {
              id: "scope",
              label: "Visibility",
              kind: "select",
              options: [
                { value: "everyone", label: "Public" },
                { value: "permission:abc", label: "Private · Team" },
              ],
            },
          ],
        },
        values: {
          scope: "everyone",
        },
        fieldErrors: {
          scope: null,
        },
        submitting: false,
        panelError: null,
      },
    });

    const select = wrapper.get('[data-test="entity-form-field-scope"]');
    await select.setValue("permission:abc");

    const updateEvents = wrapper.emitted("updateField") ?? [];
    expect(updateEvents).toHaveLength(1);
    expect(updateEvents[0]).toEqual(["scope", "permission:abc"]);
  });

  it("disables select fields when schema marks field disabled", () => {
    const wrapper = mount(EntityDefaultForm, {
      props: {
        schema: {
          fields: [
            {
              id: "status",
              label: "Status",
              kind: "select",
              disabled: true,
              options: [
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ],
            },
          ],
        },
        values: {
          status: "active",
        },
        fieldErrors: {
          status: null,
        },
        submitting: false,
        panelError: null,
      },
    });

    const select = wrapper.get('[data-test="entity-form-field-status"]');
    expect((select.element as HTMLSelectElement).disabled).toBe(true);
  });
});
