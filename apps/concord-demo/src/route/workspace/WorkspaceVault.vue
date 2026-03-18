<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from "vue";
import { generateId, stripIdentityKey } from "ternent-utils";
import {
  SBadge,
  SDialog,
  SListButton,
  SSegmentedControl,
} from "ternent-ui/components";
import { Button } from "ternent-ui/primitives";

import { useLedger } from "../../module/ledger/useLedger";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import UserPicker from "../../module/user/UserPicker.vue";

const { bridge, addItem, createPermission, addUserPermission } = useLedger();

type PermissionGrant = {
  permissionId: string;
  identity: string;
};

type PermissionGrantEntry = {
  entryId: string;
  data: PermissionGrant;
};

type Vault = {
  id: string;
  title: string;
  kind: "personal" | "shared" | "share";
  permissionId: string | null;
  createdAt: number;
  updatedAt: number;
  description?: string;
  keyMissing?: boolean;
  permission?: string;
  [key: string]: unknown;
};

type VaultEntry = {
  entryId: string;
  data: Vault;
};

type Secret = {
  id: string;
  vaultId: string;
  type: "password" | "note" | "token" | "recovery";
  label: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
  [key: string]: unknown;
};

type SecretEntry = {
  entryId: string;
  data: Secret;
};

function formatDate(
  iso: string | number,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  }
) {
  return iso
    ? new Intl.DateTimeFormat(undefined, options).format(new Date(iso))
    : "";
}

function parseTags(raw: string) {
  const tokens = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return tokens.length ? tokens : undefined;
}

function stripUndefined<T extends Record<string, any>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as T;
}

const vaults = computed<VaultEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.vaults || {})
      .sort((a, b) => (b.data.updatedAt || 0) - (a.data.updatedAt || 0))
      .map((entry) => ({
        entryId: entry.entryId,
        data: {
          ...(entry.data as Vault),
          kind: (entry.data as Vault).kind ?? "personal",
        },
      })) as VaultEntry[]
);

const secrets = computed<SecretEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.["vault-secrets"] || {})
      .sort((a, b) => (b.data.updatedAt || 0) - (a.data.updatedAt || 0))
      .map((entry) => ({
        entryId: entry.entryId,
        data: entry.data as Secret,
      })) as SecretEntry[]
);

const permissionGrants = computed<PermissionGrantEntry[]>(
  () =>
    Object.values(
      bridge.collections.byKind.value?.["permission-grants"] || {}
    ) as PermissionGrantEntry[]
);

const usersByIdentity = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.users || {}
  ) as { data: { publicIdentityKey?: string; name?: string } }[];
  const map = new Map<string, { publicIdentityKey?: string; name?: string }>();
  for (const entry of entries) {
    if (!entry?.data?.publicIdentityKey) continue;
    map.set(stripIdentityKey(entry.data.publicIdentityKey), entry.data);
  }
  return map;
});

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const activeVaultId = shallowRef<string | null>(null);
const activeSecretId = shallowRef<string | null>(null);
const selectedFilter = shallowRef<
  "all" | "password" | "note" | "token" | "recovery"
>("all");
const searchQuery = shallowRef("");

const isCreateVaultDialogOpen = ref(false);
const newVaultTitle = shallowRef("");
const newVaultDescription = shallowRef("");
const newVaultKind = shallowRef<"personal" | "shared">("personal");
const newVaultMember = shallowRef<any | null>(null);
const newVaultMembers = ref<any[]>([]);

const isCreateSecretDialogOpen = ref(false);
const isEditSecretDialogOpen = ref(false);
const editingSecret = shallowRef<SecretEntry | null>(null);

const newSecretLabel = shallowRef("");
const newSecretType = shallowRef<Secret["type"]>("password");
const newSecretUsername = shallowRef("");
const newSecretPassword = shallowRef("");
const newSecretUrl = shallowRef("");
const newSecretNotes = shallowRef("");
const newSecretTags = shallowRef("");

const isMembersDialogOpen = ref(false);
const selectedUsersByPermission = reactive<Record<string, any>>({});

const isShareDialogOpen = ref(false);
const newShareMember = shallowRef<any | null>(null);
const newShareMembers = ref<any[]>([]);

const isRotateDialogOpen = ref(false);

const isSecretRevealed = ref(false);

const filterOptions = [
  { value: "all", label: "All" },
  { value: "password", label: "Passwords" },
  { value: "note", label: "Notes" },
  { value: "token", label: "Tokens" },
  { value: "recovery", label: "Recovery" },
];

const personalVaults = computed(() =>
  vaults.value.filter((vault) => vault.data.kind === "personal")
);
const sharedVaults = computed(() =>
  vaults.value.filter((vault) => vault.data.kind === "shared")
);
const shareVaults = computed(() =>
  vaults.value.filter((vault) => vault.data.kind === "share")
);

const orderedVaults = computed(() => [
  ...personalVaults.value,
  ...sharedVaults.value,
  ...shareVaults.value,
]);

const selectedVault = computed(
  () => vaults.value.find((vault) => vault.data.id === activeVaultId.value) ?? null
);

const selectedVaultPermissionId = computed(
  () =>
    selectedVault.value?.data.permissionId ??
    selectedVault.value?.data.permission ??
    null
);

const permissionMembers = computed(() => {
  if (!selectedVaultPermissionId.value) return [];
  return permissionGrants.value.filter(
    (grant) => grant.data.permissionId === selectedVaultPermissionId.value
  );
});

const secretsByVaultId = computed(() => {
  const map = new Map<string, SecretEntry[]>();
  for (const entry of secrets.value) {
    if (!entry?.data?.vaultId) continue;
    const current = map.get(entry.data.vaultId) ?? [];
    current.push(entry);
    map.set(entry.data.vaultId, current);
  }
  for (const [vaultId, list] of map.entries()) {
    list.sort((a, b) => (b.data.updatedAt || 0) - (a.data.updatedAt || 0));
    map.set(vaultId, list);
  }
  return map;
});

const vaultSecrets = computed(() => {
  if (!selectedVault.value) return [];
  return secretsByVaultId.value.get(selectedVault.value.data.id) ?? [];
});

const filteredSecrets = computed(() => {
  let list = vaultSecrets.value;
  if (selectedFilter.value !== "all") {
    list = list.filter((entry) => entry.data.type === selectedFilter.value);
  }
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return list;
  return list.filter((entry) => {
    const { label, url, username } = entry.data;
    return [label, url, username]
      .filter(Boolean)
      .some((value) => value?.toString().toLowerCase().includes(query));
  });
});

const activeSecret = computed(
  () =>
    filteredSecrets.value.find((secret) => secret.data.id === activeSecretId.value) ??
    null
);

const vaultLocked = computed(() => Boolean(selectedVault.value?.data.keyMissing));
const secretLocked = computed(
  () => Boolean(activeSecret.value?.data.keyMissing || vaultLocked.value)
);

const canEditSecret = computed(
  () => Boolean(canAddItem.value && selectedVault.value && !vaultLocked.value)
);

const canShareSecret = computed(
  () =>
    Boolean(
      activeSecret.value &&
        !vaultLocked.value &&
        !activeSecret.value?.data.keyMissing &&
        selectedVault.value?.data.kind !== "share"
    )
);

watch(
  orderedVaults,
  (nextVaults) => {
    if (!nextVaults.length) {
      activeVaultId.value = null;
      return;
    }
    const isActiveStillVisible = nextVaults.some(
      (vault) => vault.data.id === activeVaultId.value
    );
    if (!isActiveStillVisible) {
      activeVaultId.value = nextVaults[0].data.id;
    }
  },
  { immediate: true }
);

watch(
  filteredSecrets,
  (nextSecrets) => {
    if (!nextSecrets.length) {
      activeSecretId.value = null;
      return;
    }
    const isActiveStillVisible = nextSecrets.some(
      (secret) => secret.data.id === activeSecretId.value
    );
    if (!isActiveStillVisible) {
      activeSecretId.value = nextSecrets[0].data.id;
    }
  },
  { immediate: true }
);

watch(activeSecretId, () => {
  isSecretRevealed.value = false;
});

watch(isCreateVaultDialogOpen, (nextValue) => {
  if (nextValue) return;
  newVaultTitle.value = "";
  newVaultDescription.value = "";
  newVaultKind.value = "personal";
  newVaultMember.value = null;
  newVaultMembers.value = [];
});

watch(isCreateSecretDialogOpen, (nextValue) => {
  if (nextValue) return;
  newSecretLabel.value = "";
  newSecretType.value = "password";
  newSecretUsername.value = "";
  newSecretPassword.value = "";
  newSecretUrl.value = "";
  newSecretNotes.value = "";
  newSecretTags.value = "";
});

watch(isEditSecretDialogOpen, (nextValue) => {
  if (nextValue) return;
  editingSecret.value = null;
});

watch(isShareDialogOpen, (nextValue) => {
  if (nextValue) return;
  newShareMember.value = null;
  newShareMembers.value = [];
});

function openCreateVaultDialog() {
  if (!canAddItem.value) return;
  isCreateVaultDialogOpen.value = true;
}

function openCreateSecretDialog() {
  if (!canEditSecret.value) return;
  isCreateSecretDialogOpen.value = true;
}

function openEditSecretDialog() {
  if (!canEditSecret.value || !activeSecret.value) return;
  if (activeSecret.value.data.keyMissing) return;
  editingSecret.value = activeSecret.value;
  newSecretLabel.value = activeSecret.value.data.label ?? "";
  newSecretType.value = activeSecret.value.data.type ?? "password";
  newSecretUsername.value = activeSecret.value.data.username ?? "";
  newSecretPassword.value = activeSecret.value.data.password ?? "";
  newSecretUrl.value = activeSecret.value.data.url ?? "";
  newSecretNotes.value = activeSecret.value.data.notes ?? "";
  newSecretTags.value = (activeSecret.value.data.tags ?? []).join(", ");
  isEditSecretDialogOpen.value = true;
}

function openMembersDialog() {
  if (!selectedVaultPermissionId.value) return;
  isMembersDialogOpen.value = true;
}

function openShareDialog() {
  if (!canShareSecret.value) return;
  isShareDialogOpen.value = true;
}

function openRotateDialog() {
  if (!selectedVaultPermissionId.value || !selectedVault.value) return;
  if (selectedVault.value.data.kind === "personal") return;
  isRotateDialogOpen.value = true;
}

function addVaultMember() {
  if (!newVaultMember.value) return;
  const next = newVaultMember.value;
  const exists = newVaultMembers.value.some(
    (member) => member?.publicIdentityKey === next?.publicIdentityKey
  );
  if (!exists) newVaultMembers.value = [...newVaultMembers.value, next];
  newVaultMember.value = null;
}

function addShareMember() {
  if (!newShareMember.value) return;
  const next = newShareMember.value;
  const exists = newShareMembers.value.some(
    (member) => member?.publicIdentityKey === next?.publicIdentityKey
  );
  if (!exists) newShareMembers.value = [...newShareMembers.value, next];
  newShareMember.value = null;
}

async function createVault() {
  const title = newVaultTitle.value.trim();
  if (!title) return;
  const permission = await createPermission(title, "vault");
  if (!permission?.id) return;
  if (newVaultKind.value === "shared" && newVaultMembers.value.length) {
    for (const member of newVaultMembers.value) {
      if (!member?.publicIdentityKey || !member?.publicEncryptionKey) continue;
      await addUserPermission(
        permission.id,
        member.publicIdentityKey,
        member.publicEncryptionKey
      );
    }
  }
  const vaultId = generateId();
  await addItem(
    stripUndefined({
      id: vaultId,
      title,
      kind: newVaultKind.value,
      permissionId: permission.id,
      description: newVaultDescription.value.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    "vaults",
    permission.id
  );
  activeVaultId.value = vaultId;
  isCreateVaultDialogOpen.value = false;
}

async function createSecret() {
  if (!selectedVault.value || vaultLocked.value) return;
  const label = newSecretLabel.value.trim();
  if (!label) return;
  const permissionId = selectedVaultPermissionId.value;
  if (!permissionId) return;
  const secretId = generateId();
  await addItem(
    stripUndefined({
      id: secretId,
      vaultId: selectedVault.value.data.id,
      type: newSecretType.value,
      label,
      permissionId,
      username: newSecretUsername.value.trim() || undefined,
      password: newSecretPassword.value || undefined,
      url: newSecretUrl.value.trim() || undefined,
      notes: newSecretNotes.value.trim() || undefined,
      tags: parseTags(newSecretTags.value),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    "vault-secrets",
    permissionId
  );
  activeSecretId.value = secretId;
  isCreateSecretDialogOpen.value = false;
}

async function updateSecret() {
  if (!editingSecret.value) return;
  const label = newSecretLabel.value.trim();
  if (!label) return;
  const current = editingSecret.value.data;
  const permissionId =
    current.permissionId ?? current.permission ?? selectedVaultPermissionId.value;
  await addItem(
    stripUndefined({
      ...current,
      label,
      type: newSecretType.value,
      permissionId: permissionId ?? undefined,
      username: newSecretUsername.value.trim() || undefined,
      password: newSecretPassword.value || undefined,
      url: newSecretUrl.value.trim() || undefined,
      notes: newSecretNotes.value.trim() || undefined,
      tags: parseTags(newSecretTags.value),
      updatedAt: Date.now(),
    }),
    "vault-secrets",
    permissionId ?? null
  );
  isEditSecretDialogOpen.value = false;
}

async function addUserToPermission(permissionId: string) {
  const selectedUser = selectedUsersByPermission[permissionId];
  if (!selectedUser) return;
  await addUserPermission(
    permissionId,
    selectedUser.publicIdentityKey,
    selectedUser.publicEncryptionKey
  );
  selectedUsersByPermission[permissionId] = null;
}

async function shareSecret() {
  if (!activeSecret.value) return;
  if (!newShareMembers.value.length) return;
  const secret = activeSecret.value.data;
  const permission = await createPermission(`Share: ${secret.label}`, "vault");
  if (!permission?.id) return;
  for (const member of newShareMembers.value) {
    if (!member?.publicIdentityKey || !member?.publicEncryptionKey) continue;
    await addUserPermission(
      permission.id,
      member.publicIdentityKey,
      member.publicEncryptionKey
    );
  }
  const shareVaultId = generateId();
  await addItem(
    stripUndefined({
      id: shareVaultId,
      title: `Shared: ${secret.label}`,
      kind: "share",
      permissionId: permission.id,
      description: "Auto-created share vault.",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    "vaults",
    permission.id
  );
  await addItem(
    stripUndefined({
      id: generateId(),
      vaultId: shareVaultId,
      type: secret.type,
      label: secret.label,
      permissionId: permission.id,
      username: secret.username,
      password: secret.password,
      url: secret.url,
      notes: secret.notes,
      tags: secret.tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    "vault-secrets",
    permission.id
  );
  isShareDialogOpen.value = false;
}

async function rotateVaultKey() {
  if (!selectedVault.value || !selectedVaultPermissionId.value) return;
  const permission = await createPermission(
    `${selectedVault.value.data.title} (rotated)`,
    "vault"
  );
  if (!permission?.id) return;
  for (const member of permissionMembers.value) {
    const user = usersByIdentity.value.get(member.data.identity);
    if (!user?.publicIdentityKey || !user?.publicEncryptionKey) continue;
    await addUserPermission(
      permission.id,
      user.publicIdentityKey,
      user.publicEncryptionKey
    );
  }
  await addItem(
    stripUndefined({
      ...selectedVault.value.data,
      permissionId: permission.id,
      updatedAt: Date.now(),
    }),
    "vaults",
    permission.id
  );
  isRotateDialogOpen.value = false;
}

async function copyToClipboard(value?: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // ignore clipboard failures
  }
}

const secretTypeLabel = (value?: Secret["type"]) => {
  switch (value) {
    case "password":
      return "Password";
    case "note":
      return "Note";
    case "token":
      return "Token";
    case "recovery":
      return "Recovery";
    default:
      return "Secret";
  }
};
</script>

<template>
  <div class="w-full flex flex-1 min-h-0 font-mono">
    <aside
      class="hidden lg:flex flex-col w-64 border-r border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 gap-4"
    >
      <div class="flex items-center justify-between text-xs">
        <span class="uppercase tracking-[0.16em] opacity-60">Vaults</span>
        <Button
          type="button"
          size="xs"
          variant="plain-secondary"
          class="text-[11px] uppercase tracking-[0.12em]"
          @click="openCreateVaultDialog"
        >
          New vault
        </Button>
      </div>

      <div class="flex flex-col gap-3">
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Personal
        </div>
        <SListButton
          v-for="vault in personalVaults"
          :key="vault.entryId"
          :active="activeVaultId === vault.data.id"
          variant="secondary"
          size="sm"
          @click="activeVaultId = vault.data.id"
        >
          <span class="truncate">
            {{ vault.data.keyMissing ? "Insufficient permission" : vault.data.title }}
          </span>
          <template #badge>
            <SBadge
              v-if="vault.data.keyMissing"
              size="xs"
              tone="critical"
              variant="outline"
            >
              Locked
            </SBadge>
          </template>
        </SListButton>
        <div v-if="!personalVaults.length" class="text-xs opacity-60">
          No personal vaults.
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Shared
        </div>
        <SListButton
          v-for="vault in sharedVaults"
          :key="vault.entryId"
          :active="activeVaultId === vault.data.id"
          variant="secondary"
          size="sm"
          @click="activeVaultId = vault.data.id"
        >
          <span class="truncate">
            {{ vault.data.keyMissing ? "Insufficient permission" : vault.data.title }}
          </span>
          <template #badge>
            <SBadge
              v-if="vault.data.keyMissing"
              size="xs"
              tone="critical"
              variant="outline"
            >
              Locked
            </SBadge>
          </template>
        </SListButton>
        <div v-if="!sharedVaults.length" class="text-xs opacity-60">
          No shared vaults.
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Shared individually
        </div>
        <SListButton
          v-for="vault in shareVaults"
          :key="vault.entryId"
          :active="activeVaultId === vault.data.id"
          variant="secondary"
          size="sm"
          @click="activeVaultId = vault.data.id"
        >
          <span class="truncate">
            {{ vault.data.keyMissing ? "Insufficient permission" : vault.data.title }}
          </span>
          <template #badge>
            <SBadge
              v-if="vault.data.keyMissing"
              size="xs"
              tone="critical"
              variant="outline"
            >
              Locked
            </SBadge>
          </template>
        </SListButton>
        <div v-if="!shareVaults.length" class="text-xs opacity-60">
          No share vaults.
        </div>
      </div>
    </aside>

    <section class="flex-1 flex flex-col gap-4 min-h-0">
      <header
        class="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-between px-4 py-3 backdrop-blur border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 90%, transparent)]"
      >
        <div class="flex items-center gap-3 min-w-0">
          <h2 class="text-sm font-thin truncate">
            {{ selectedVault?.data.title || "Vault" }}
          </h2>
          <span class="text-xs text-[var(--ui-fg-muted)]">
            {{
              selectedVault
                ? `${vaultSecrets.length} secrets`
                : "Select a vault"
            }}
          </span>
        </div>

        <div class="flex items-center gap-2 text-xs flex-wrap">
          <SSegmentedControl
            v-model="selectedFilter"
            :items="filterOptions"
            size="xs"
            aria-label="Secret filter"
          />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search"
            class="h-8 rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)]"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            :disabled="!canEditSecret"
            @click="openCreateSecretDialog"
          >
            New secret
          </Button>
          <Button
            v-if="selectedVault?.data.kind !== 'personal' && selectedVaultPermissionId"
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            @click="openMembersDialog"
          >
            Members ({{ permissionMembers.length }})
          </Button>
          <Button
            v-if="selectedVault?.data.kind !== 'personal' && selectedVaultPermissionId"
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            @click="openRotateDialog"
          >
            Rotate key
          </Button>
        </div>
      </header>

      <div class="lg:hidden flex gap-2 overflow-x-auto pb-2 px-4">
        <SListButton
          v-for="vault in orderedVaults"
          :key="vault.entryId"
          :active="activeVaultId === vault.data.id"
          variant="secondary"
          size="sm"
          :full-width="false"
          class="shrink-0"
          @click="activeVaultId = vault.data.id"
        >
          {{ vault.data.keyMissing ? "Locked" : vault.data.title }}
        </SListButton>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          class="!rounded-full shrink-0"
          @click="openCreateVaultDialog"
        >
          New vault
        </Button>
      </div>

      <div class="overflow-hidden flex-1 px-4 pb-4">
        <div class="flex-1 min-h-0 flex flex-col xl:flex-row gap-3">
          <div class="flex-1 overflow-auto min-h-0 flex flex-col gap-3">
            <ul
              class="w-full flex flex-col border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))]"
            >
              <li
                v-for="secret in filteredSecrets"
                :key="secret.entryId"
                class="border-b border-[var(--ui-border)] last:border-b-0"
              >
                <div
                  class="flex items-center gap-3 px-3 py-2 text-sm transition"
                  :class="
                    secret.data.id === activeSecretId
                      ? 'bg-[var(--ui-surface-hover)]'
                      : 'hover:bg-[var(--ui-surface-hover)]/70'
                  "
                  @click="activeSecretId = secret.data.id"
                >
                  <div class="flex-1 min-w-0">
                    <p class="truncate">
                      {{
                        secret.data.keyMissing || vaultLocked
                          ? 'Insufficient permission'
                          : secret.data.label
                      }}
                    </p>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-[var(--ui-fg-muted)]">
                      <SBadge size="xs" tone="neutral" variant="outline">
                        {{ secretTypeLabel(secret.data.type) }}
                      </SBadge>
                      <template v-if="secret.data.tags?.length">
                        <SBadge
                          v-for="tag in secret.data.tags.slice(0, 2)"
                          :key="tag"
                          size="xs"
                          tone="secondary"
                          variant="outline"
                        >
                          {{ tag }}
                        </SBadge>
                        <SBadge
                          v-if="secret.data.tags.length > 2"
                          size="xs"
                          tone="secondary"
                          variant="outline"
                        >
                          +{{ secret.data.tags.length - 2 }}
                        </SBadge>
                      </template>
                    </div>
                  </div>

                  <div class="ml-auto flex items-center gap-2 text-xs text-[var(--ui-fg-muted)]">
                    <SBadge
                      size="xs"
                      :tone="secret.data.keyMissing || vaultLocked ? 'critical' : 'secondary'"
                      variant="outline"
                    >
                      {{
                        secret.data.keyMissing || vaultLocked
                          ? 'Locked'
                          : selectedVault?.data.kind === 'personal'
                            ? 'Private'
                            : 'Shared'
                      }}
                    </SBadge>
                    <SBadge size="xs" tone="neutral" variant="outline">
                      {{
                        formatDate(secret.data.updatedAt, {
                          dateStyle: 'medium',
                        })
                      }}
                    </SBadge>
                  </div>
                </div>
              </li>
              <li v-if="!filteredSecrets.length" class="py-8 px-3 text-sm">
                <div
                  class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
                >
                  No secrets yet. Add your first entry.
                </div>
              </li>
            </ul>
          </div>

          <aside
            class="w-full xl:w-[360px] border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 96%, var(--ui-bg))] rounded-lg p-4 flex flex-col gap-4 min-h-0"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.16em] opacity-60">
                  Secret details
                </p>
                <h3 class="text-sm font-semibold">
                  {{
                    activeSecret?.data.keyMissing || vaultLocked
                      ? "Locked"
                      : activeSecret?.data.label || "No secret selected"
                  }}
                </h3>
              </div>
              <div class="flex gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  :disabled="!canEditSecret || !activeSecret"
                  @click="openEditSecretDialog"
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  :disabled="!canShareSecret"
                  @click="openShareDialog"
                >
                  Share
                </Button>
              </div>
            </div>

            <div v-if="!activeSecret" class="text-xs text-[var(--ui-fg-muted)]">
              Select a secret to view details.
            </div>

            <div
              v-else-if="activeSecret.data.keyMissing || vaultLocked"
              class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-critical)]"
            >
              Insufficient permission to view this secret.
            </div>

            <div v-else class="flex flex-col gap-4 text-sm">
              <div class="flex items-center gap-2">
                <SBadge size="xs" tone="neutral" variant="outline">
                  {{ secretTypeLabel(activeSecret.data.type) }}
                </SBadge>
                <SBadge size="xs" tone="secondary" variant="outline">
                  {{
                    selectedVault?.data.kind === 'personal' ? 'Private' : 'Shared'
                  }}
                </SBadge>
              </div>

              <div class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-[0.16em] opacity-60">
                  Label
                </span>
                <span>{{ activeSecret.data.label }}</span>
              </div>

              <div v-if="activeSecret.data.url" class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-[0.16em] opacity-60">
                  URL
                </span>
                <a
                  :href="activeSecret.data.url"
                  target="_blank"
                  rel="noreferrer"
                  class="text-[var(--ui-primary)] break-all"
                >
                  {{ activeSecret.data.url }}
                </a>
              </div>

              <div v-if="activeSecret.data.username" class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-[0.16em] opacity-60">
                  Username
                </span>
                <span class="break-all">{{ activeSecret.data.username }}</span>
              </div>

              <div v-if="activeSecret.data.password" class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs uppercase tracking-[0.16em] opacity-60">
                    {{ activeSecret.data.type === "token" ? "Token" : "Password" }}
                  </span>
                  <div class="flex items-center gap-2">
                    <Button
                      type="button"
                      size="xs"
                      variant="plain-secondary"
                      @click="isSecretRevealed = !isSecretRevealed"
                    >
                      {{ isSecretRevealed ? "Hide" : "Reveal" }}
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="plain-secondary"
                      @click="copyToClipboard(activeSecret.data.password)"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div class="font-mono tracking-[0.2em]">
                  {{
                    isSecretRevealed
                      ? activeSecret.data.password
                      : "******"
                  }}
                </div>
              </div>

              <div v-if="activeSecret.data.notes" class="flex flex-col gap-1">
                <span class="text-xs uppercase tracking-[0.16em] opacity-60">
                  Notes
                </span>
                <p class="text-xs leading-relaxed whitespace-pre-wrap">
                  {{ activeSecret.data.notes }}
                </p>
              </div>

              <div v-if="activeSecret.data.tags?.length" class="flex flex-col gap-2">
                <span class="text-xs uppercase tracking-[0.16em] opacity-60">
                  Tags
                </span>
                <div class="flex flex-wrap gap-2">
                  <SBadge
                    v-for="tag in activeSecret.data.tags"
                    :key="tag"
                    size="xs"
                    tone="secondary"
                    variant="outline"
                  >
                    {{ tag }}
                  </SBadge>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <SDialog
      v-model:open="isCreateVaultDialogOpen"
      title="Create vault"
      size="lg"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </template>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Title
          </label>
          <input
            v-model="newVaultTitle"
            type="text"
            class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
            placeholder="Personal vault"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Description
          </label>
          <textarea
            v-model="newVaultDescription"
            rows="3"
            class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-sm"
            placeholder="Optional description"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Vault type
          </label>
          <SSegmentedControl
            v-model="newVaultKind"
            :items="[
              { value: 'personal', label: 'Personal' },
              { value: 'shared', label: 'Shared' },
            ]"
            size="sm"
          />
        </div>

        <div v-if="newVaultKind === 'shared'" class="flex flex-col gap-3">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Members
          </label>
          <div class="flex items-center gap-2">
            <UserPicker v-model="newVaultMember" />
            <Button type="button" size="sm" @click="addVaultMember">
              Add member
            </Button>
          </div>
          <div v-if="newVaultMembers.length" class="flex flex-col gap-2">
            <div
              v-for="member in newVaultMembers"
              :key="member.publicIdentityKey"
              class="flex items-center justify-between rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs"
            >
              <div class="flex items-center gap-2">
                <IdentityAvatar
                  :identity="member.publicIdentityKey"
                  size="xs"
                />
                <span class="truncate">
                  {{ member.name || member.publicIdentityKey }}
                </span>
              </div>
              <Button
                type="button"
                size="xs"
                variant="plain-secondary"
                @click="
                  newVaultMembers = newVaultMembers.filter(
                    (item) => item.publicIdentityKey !== member.publicIdentityKey
                  )
                "
              >
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="isCreateVaultDialogOpen = false">
            Cancel
          </Button>
          <Button type="button" @click="createVault">Create</Button>
        </div>
      </div>
    </SDialog>

    <SDialog
      v-model:open="isCreateSecretDialogOpen"
      title="Create secret"
      size="lg"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </template>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Label
          </label>
          <input
            v-model="newSecretLabel"
            type="text"
            class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
            placeholder="GitHub account"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Type
          </label>
          <SSegmentedControl
            v-model="newSecretType"
            :items="[
              { value: 'password', label: 'Password' },
              { value: 'note', label: 'Note' },
              { value: 'token', label: 'Token' },
              { value: 'recovery', label: 'Recovery' },
            ]"
            size="sm"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs uppercase tracking-[0.16em] opacity-60">
              Username
            </label>
            <input
              v-model="newSecretUsername"
              type="text"
              class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
              placeholder="sam@example.com"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs uppercase tracking-[0.16em] opacity-60">
              Password / Token
            </label>
            <input
              v-model="newSecretPassword"
              type="text"
              class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
              placeholder="******"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            URL
          </label>
          <input
            v-model="newSecretUrl"
            type="text"
            class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
            placeholder="https://example.com"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Notes
          </label>
          <textarea
            v-model="newSecretNotes"
            rows="4"
            class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-sm"
            placeholder="Optional notes"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Tags
          </label>
          <input
            v-model="newSecretTags"
            type="text"
            class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
            placeholder="work, finance, personal"
          />
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="isCreateSecretDialogOpen = false">
            Cancel
          </Button>
          <Button type="button" @click="createSecret">Save</Button>
        </div>
      </div>
    </SDialog>

    <SDialog
      v-if="editingSecret"
      v-model:open="isEditSecretDialogOpen"
      title="Edit secret"
      size="lg"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 7.125 16.862 4.487"
          />
        </svg>
      </template>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Label
          </label>
          <input
            v-model="newSecretLabel"
            type="text"
            class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Type
          </label>
          <SSegmentedControl
            v-model="newSecretType"
            :items="[
              { value: 'password', label: 'Password' },
              { value: 'note', label: 'Note' },
              { value: 'token', label: 'Token' },
              { value: 'recovery', label: 'Recovery' },
            ]"
            size="sm"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-xs uppercase tracking-[0.16em] opacity-60">
              Username
            </label>
            <input
              v-model="newSecretUsername"
              type="text"
              class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs uppercase tracking-[0.16em] opacity-60">
              Password / Token
            </label>
            <input
              v-model="newSecretPassword"
              type="text"
              class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            URL
          </label>
          <input
            v-model="newSecretUrl"
            type="text"
            class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Notes
          </label>
          <textarea
            v-model="newSecretNotes"
            rows="4"
            class="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 py-2 text-sm"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Tags
          </label>
          <input
            v-model="newSecretTags"
            type="text"
            class="h-10 rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3 text-sm"
          />
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="isEditSecretDialogOpen = false">
            Cancel
          </Button>
          <Button type="button" @click="updateSecret">Save changes</Button>
        </div>
      </div>
    </SDialog>

    <SDialog
      v-model:open="isMembersDialogOpen"
      :title="selectedVault?.data.title || 'Members'"
      size="lg"
    >
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M18 18.72a9.094 9.094 0 0 0 3.741-7.346A9 9 0 0 0 12 3a9 9 0 0 0-9.741 8.374A9.094 9.094 0 0 0 6 18.72M12 9.75a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <UserPicker
            v-model="
              selectedUsersByPermission[selectedVaultPermissionId || '']
            "
          />
          <Button
            type="button"
            size="sm"
            :disabled="!selectedVaultPermissionId"
            @click="
              selectedVaultPermissionId &&
                addUserToPermission(selectedVaultPermissionId)
            "
          >
            Add member
          </Button>
        </div>

        <div v-if="permissionMembers.length" class="flex flex-col gap-2">
          <div
            v-for="member in permissionMembers"
            :key="member.entryId"
            class="flex items-center gap-3 rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs"
          >
            <IdentityAvatar
              :identity="
                usersByIdentity.get(member.data.identity)?.publicIdentityKey ||
                member.data.identity
              "
              size="xs"
            />
            <span class="truncate">
              {{
                usersByIdentity.get(member.data.identity)?.name ||
                member.data.identity
              }}
            </span>
          </div>
        </div>
        <div v-else class="text-xs text-[var(--ui-fg-muted)]">
          No members yet.
        </div>
      </div>
    </SDialog>

    <SDialog v-model:open="isShareDialogOpen" title="Share secret" size="lg">
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7.5 8.25h9m-9 3H12m-4.5 3h9M9 3.75h6A2.25 2.25 0 0 1 17.25 6v12A2.25 2.25 0 0 1 15 20.25H9A2.25 2.25 0 0 1 6.75 18V6A2.25 2.25 0 0 1 9 3.75Z"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-4">
        <p class="text-xs text-[var(--ui-fg-muted)]">
          This will create a dedicated shared vault for this secret.
        </p>
        <div class="flex items-center gap-2">
          <UserPicker v-model="newShareMember" />
          <Button type="button" size="sm" @click="addShareMember">
            Add member
          </Button>
        </div>
        <div v-if="newShareMembers.length" class="flex flex-col gap-2">
          <div
            v-for="member in newShareMembers"
            :key="member.publicIdentityKey"
            class="flex items-center justify-between rounded-md border border-[var(--ui-border)] px-3 py-2 text-xs"
          >
            <div class="flex items-center gap-2">
              <IdentityAvatar
                :identity="member.publicIdentityKey"
                size="xs"
              />
              <span class="truncate">
                {{ member.name || member.publicIdentityKey }}
              </span>
            </div>
            <Button
              type="button"
              size="xs"
              variant="plain-secondary"
              @click="
                newShareMembers = newShareMembers.filter(
                  (item) => item.publicIdentityKey !== member.publicIdentityKey
                )
              "
            >
              Remove
            </Button>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="isShareDialogOpen = false">
            Cancel
          </Button>
          <Button
            type="button"
            :disabled="!newShareMembers.length"
            @click="shareSecret"
          >
            Share
          </Button>
        </div>
      </div>
    </SDialog>

    <SDialog v-model:open="isRotateDialogOpen" title="Rotate key" size="lg">
      <template #icon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </template>
      <div class="flex flex-col gap-4">
        <p class="text-sm">
          Rotation affects new entries. Old entries remain under the previous
          key.
        </p>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="isRotateDialogOpen = false">
            Cancel
          </Button>
          <Button type="button" @click="rotateVaultKey">Rotate</Button>
        </div>
      </div>
    </SDialog>
  </div>
</template>
