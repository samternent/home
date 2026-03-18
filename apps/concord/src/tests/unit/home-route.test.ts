import { nextTick } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import RouteHome from "@/routes/home/RouteHome.vue";

function createWrapper() {
  return mount(RouteHome, {
    global: {
      stubs: {
        RouterLink: {
          props: ["to"],
          template: "<a :href=\"to\"><slot /></a>",
        },
        PublishedSiteProofBadge: {
          template: "<span>Published site proof</span>",
        },
      },
    },
  });
}

async function clickTab(
  wrapper: ReturnType<typeof createWrapper>,
  label: string,
) {
  const tab = wrapper
    .findAll('[role="tab"]')
    .find((candidate) => candidate.text() === label);

  expect(tab, `expected tab "${label}" to exist`).toBeTruthy();
  await tab!.trigger("click");
  await nextTick();
}

describe("RouteHome landing page", () => {
  it("renders the Concord landing content and ledger artifact section", async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await nextTick();
    const text = wrapper.text();

    expect(text).toContain(
      "A command-first runtime for verifiable, non-custodial applications.",
    );
    expect(text).toContain("Concord app runtime");
    expect(text).toContain("Todo plugin demo");
    expect(text).toContain("Buy milk");
    expect(text).toContain("Review portable ledger");
    expect(text).toContain("Stage item");
    expect(text).toContain("Commit staged");
    expect(text).toContain("staged changes");
    expect(text).toContain("The runtime");
    expect(text).toContain("A portable ledger artifact");
    expect(text).toContain("concord-ledger.json");
    expect(text).toContain("Load the artifact, probe a signed boundary");
    expect(text).toContain("Validation");
    expect(text).toContain("valid");
    expect(text).toContain("Tamper entry payload");
    expect(text).toContain("Reorder commit entries");
    expect(text).toContain("Break parent link");
    expect(text).toContain("Corrupt payload hash");
    expect(text).toContain("Corrupt commit proof");
    expect(text).toContain("Reset");
    expect(text).toContain("document valid");
    expect(text).toContain("commit linkage valid");
    expect(text).toContain("commit proofs valid");
    expect(text).toContain("entry identities valid");
    expect(text).toContain("entry proofs valid");
    expect(text).toContain("payload hashes valid");
    expect(text).toContain(
      "Any invalid committed byte invalidates the whole document.",
    );
    expect(text).toContain("One signed history. Multiple runtime surfaces.");
    expect(text).toContain("Build an app without owning user data");
    expect(text).toContain("For developers");
    expect(text).toContain('await app.command("todo.create-item"');
    expect(text).toContain("Create and refine first todo");

    expect(text).toContain("JavaScript");
    expect(text).toContain("Ledger + Seal");
    expect(text).toContain("Projection targets");
    expect(text).toContain('import { createConcordApp } from "@ternent/concord"');

    const tamperButton = wrapper
      .findAll("button")
      .find((candidate) => candidate.text() === "Tamper entry payload");
    expect(tamperButton).toBeTruthy();
    await tamperButton!.trigger("click");
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain("artifact invalid");
    expect(wrapper.text()).toContain("fail");

    await clickTab(wrapper, "Ledger + Seal");

    expect(wrapper.text()).toContain("const verification = await app.verify()");
    expect(wrapper.text()).toContain("const ledger = await app.exportLedger()");
    expect(wrapper.text()).toContain("Commit private note");

    await clickTab(wrapper, "Projection targets");

    expect(wrapper.text()).toContain("projectionTargets: [loki.target]");
    expect(wrapper.text()).toContain("Commit todo projection");
    expect(wrapper.text()).toContain(
      'const rows = loki.getCollection("concord/all")?.find() ?? []',
    );
  });
});
