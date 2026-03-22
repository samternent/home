<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Card } from "ternent-ui/primitives";
import { useIdentitySession } from "@/modules/identity";
import { usePixpaxFamilySync } from "@/modules/family/usePixpaxFamilySync";

const identities = useIdentitySession();
const family = usePixpaxFamilySync();
const renamingIdentityId = ref("");
const renameValue = ref("");

const sortedLocalChildren = computed(() =>
  [...identities.identities.value].sort((left, right) =>
    String(left.displayName || left.id).localeCompare(String(right.displayName || right.id)),
  ),
);

function startRename(identityId: string, currentName: string) {
  renamingIdentityId.value = identityId;
  renameValue.value = currentName;
}

function saveRename(identityId: string) {
  identities.updateIdentity(identityId, { displayName: renameValue.value.trim() || undefined });
  renamingIdentityId.value = "";
  renameValue.value = "";
}
</script>

<template>
  <div class="space-y-6">
    <Card variant="showcase" padding="sm" class="space-y-4">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Children</p>
        <h2 class="m-0 text-xl font-semibold">Choose who is collecting right now</h2>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          Each child keeps their own Pixbook. Switching child switches the stickerbook and claimed packs for this device.
        </p>
      </div>
    </Card>

    <div class="grid gap-4">
      <Card
        v-for="child in sortedLocalChildren"
        :key="child.id"
        variant="subtle"
        padding="sm"
        class="space-y-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <p class="m-0 text-lg font-semibold">
              {{ child.displayName || child.id }}
              <span
                v-if="identities.identity.value?.id === child.id"
                class="ml-2 text-xs uppercase tracking-[0.2em] text-[var(--ui-accent)]"
              >
                Open now
              </span>
            </p>
            <p class="m-0 text-xs text-[var(--ui-fg-muted)]">
              {{ child.managedUserId ? "Saved to family" : "Local to this device" }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              size="sm"
              :variant="identities.identity.value?.id === child.id ? 'secondary' : 'plain-secondary'"
              @click="identities.setActiveIdentity(child.id)"
            >
              {{ identities.identity.value?.id === child.id ? "Open now" : "Open this child" }}
            </Button>
            <Button size="sm" variant="plain-secondary" @click="family.saveLocalIdentityToFamily(child.id)">
              Save to family
            </Button>
            <Button size="sm" variant="plain-secondary" @click="family.backupLocalIdentityToFamily(child.id)">
              Back up keys
            </Button>
          </div>
        </div>

        <div v-if="renamingIdentityId === child.id" class="flex flex-wrap gap-2">
          <input
            v-model="renameValue"
            type="text"
            class="min-w-[16rem] flex-1 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-3 text-sm text-[var(--ui-fg)]"
          />
          <Button size="sm" variant="secondary" @click="saveRename(child.id)">Save name</Button>
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <Button size="sm" variant="plain-secondary" @click="startRename(child.id, child.displayName || '')">
            Rename child
          </Button>
          <Button
            size="sm"
            variant="plain-secondary"
            :disabled="sortedLocalChildren.length <= 1"
            @click="identities.removeIdentity(child.id)"
          >
            Remove from this device
          </Button>
        </div>
      </Card>
    </div>

    <Card variant="subtle" padding="sm" class="space-y-4">
      <div class="space-y-1">
        <p class="m-0 text-[11px] uppercase tracking-[0.24em] text-[var(--ui-fg-muted)]">Recoverable children</p>
        <p class="m-0 text-sm text-[var(--ui-fg-muted)]">
          These children exist in the family space but are not on this device yet.
        </p>
      </div>

      <div v-if="family.recoverableManagedIdentities.value.length" class="grid gap-3">
        <div
          v-for="entry in family.recoverableManagedIdentities.value"
          :key="entry.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[var(--ui-border)] bg-[rgba(255,255,255,0.03)] p-4"
        >
          <div>
            <p class="m-0 font-semibold">{{ entry.displayName }}</p>
            <p class="m-0 text-xs text-[var(--ui-fg-muted)]">Saved in your family space</p>
          </div>
          <Button size="sm" variant="secondary" @click="family.openFamilyChildOnDevice(entry.id)">
            Open on this device
          </Button>
        </div>
      </div>
      <p v-else class="m-0 text-sm text-[var(--ui-fg-muted)]">
        No extra family children are waiting to be opened here.
      </p>

      <p v-if="family.familyError.value" class="m-0 text-sm text-[var(--ui-danger)]">{{ family.familyError.value }}</p>
      <p v-else-if="family.familyStatus.value" class="m-0 text-sm text-[var(--ui-fg-muted)]">{{ family.familyStatus.value }}</p>
    </Card>
  </div>
</template>
