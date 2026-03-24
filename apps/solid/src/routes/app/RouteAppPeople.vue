<script setup lang="ts">
import { ref } from "vue";
import { Button, Card, Input, Textarea } from "ternent-ui/primitives";
import { useConcordOsCore } from "@/modules/concord-os";

const workspace = useConcordOsCore();

const webId = ref("");
const label = ref("");
const note = ref("");

async function savePerson() {
  await workspace.upsertPerson({
    webId: webId.value,
    label: label.value,
    note: note.value,
  });
  webId.value = "";
  label.value = "";
  note.value = "";
}
</script>

<template>
  <div class="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] p-4">
    <section class="space-y-4 overflow-auto">
      <Card variant="subtle" padding="sm" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Saved WebIDs
        </p>

        <div
          v-for="person in workspace.people.value.people"
          :key="person.webId"
          class="space-y-2 rounded-xl border border-[var(--ui-border)] px-3 py-3"
        >
          <p class="m-0 text-sm text-[var(--ui-fg)]">
            {{ person.label || person.webId }}
          </p>
          <p class="m-0 break-all text-[11px] text-[var(--ui-fg-muted)]">
            {{ person.webId }}
          </p>
          <p
            v-if="person.note"
            class="m-0 text-[11px] text-[var(--ui-fg-muted)]"
          >
            {{ person.note }}
          </p>
          <div class="flex flex-wrap gap-2">
            <Button size="xs" variant="plain-secondary" @click="workspace.deletePerson(person.webId)">
              Remove
            </Button>
          </div>
        </div>

        <p
          v-if="!workspace.people.value.people.length"
          class="m-0 text-[11px] text-[var(--ui-fg-muted)]"
        >
          No saved principals yet.
        </p>
      </Card>
    </section>

    <aside class="space-y-4 overflow-auto">
      <Card variant="subtle" padding="sm" class="space-y-3">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">
          Add person
        </p>

        <label class="space-y-1">
          <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
            WebID
          </span>
          <Input v-model="webId" aria-label="Person WebID" placeholder="https://alice.example/profile/card#me" />
        </label>

        <label class="space-y-1">
          <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
            Label
          </span>
          <Input v-model="label" aria-label="Person label" placeholder="Alice" />
        </label>

        <label class="space-y-1">
          <span class="text-[11px] uppercase tracking-[0.2em] text-[var(--ui-fg-muted)]">
            Note
          </span>
          <Textarea v-model="note" aria-label="Person note" rows="4" />
        </label>

        <Button size="sm" variant="secondary" @click="savePerson">
          Save person
        </Button>
      </Card>
    </aside>
  </div>
</template>
