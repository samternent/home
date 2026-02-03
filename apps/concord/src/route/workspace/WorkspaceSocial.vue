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
import { useIdentity } from "../../module/identity/useIdentity";
import IdentityAvatar from "../../module/identity/IdentityAvatar.vue";
import UserPicker from "../../module/user/UserPicker.vue";

const { bridge, addItem, createPermission, addUserPermission } = useLedger();
const { publicKeyPEM } = useIdentity();

type PermissionGroup = {
  id: string;
  title: string;
  public: string;
  createdBy: string;
  scope: string;
};

type PermissionGroupEntry = {
  entryId: string;
  data: PermissionGroup;
};

type PermissionGrant = {
  permissionId: string;
  identity: string;
};

type PermissionGrantEntry = {
  entryId: string;
  data: PermissionGrant;
};

type Post = {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  authorId?: string;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
  [key: string]: unknown;
};

type PostEntry = {
  entryId: string;
  data: Post;
};

type Comment = {
  id: string;
  postId: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  authorId?: string;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
  [key: string]: unknown;
};

type CommentEntry = {
  entryId: string;
  data: Comment;
};

type DmThread = {
  id: string;
  title: string;
  permissionId: string;
  createdAt: number;
  updatedAt: number;
  keyMissing?: boolean;
  permission?: string;
  [key: string]: unknown;
};

type DmThreadEntry = {
  entryId: string;
  data: DmThread;
};

type DmMessage = {
  id: string;
  threadId: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  authorId?: string;
  keyMissing?: boolean;
  permission?: string;
  permissionId?: string | null;
  [key: string]: unknown;
};

type DmMessageEntry = {
  entryId: string;
  data: DmMessage;
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
    : null;
}

const posts = computed<PostEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.posts || {})
      .sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0))
      .map((entry) => ({
        entryId: entry.entryId,
        data: entry.data as Post,
      })) as PostEntry[]
);

const commentsByPostId = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.comments || {}
  ) as CommentEntry[];
  const map = new Map<string, CommentEntry[]>();
  for (const entry of entries) {
    if (!entry?.data?.postId) continue;
    const current = map.get(entry.data.postId) ?? [];
    current.push(entry);
    map.set(entry.data.postId, current);
  }
  for (const [postId, list] of map.entries()) {
    list.sort((a, b) => (a.data.createdAt || 0) - (b.data.createdAt || 0));
    map.set(postId, list);
  }
  return map;
});

const permissions = computed<PermissionGroupEntry[]>(
  () =>
    Object.values(
      bridge.collections.byKind.value?.["permission-groups"] || {}
    ).filter((entry) => entry.data.scope === "social") as PermissionGroupEntry[]
);

const permissionGrants = computed<PermissionGrantEntry[]>(
  () =>
    Object.values(
      bridge.collections.byKind.value?.["permission-grants"] || {}
    ) as PermissionGrantEntry[]
);

const dmThreads = computed<DmThreadEntry[]>(
  () =>
    Object.values(bridge.collections.byKind.value?.["dm-threads"] || {})
      .sort((a, b) => (b.data.updatedAt || 0) - (a.data.updatedAt || 0))
      .map((entry) => ({
        entryId: entry.entryId,
        data: entry.data as DmThread,
      })) as DmThreadEntry[]
);

const dmMessagesByThreadId = computed(() => {
  const entries = Object.values(
    bridge.collections.byKind.value?.["dm-messages"] || {}
  ) as DmMessageEntry[];
  const map = new Map<string, DmMessageEntry[]>();
  for (const entry of entries) {
    if (!entry?.data?.threadId) continue;
    const current = map.get(entry.data.threadId) ?? [];
    current.push(entry);
    map.set(entry.data.threadId, current);
  }
  for (const [threadId, list] of map.entries()) {
    list.sort((a, b) => (a.data.createdAt || 0) - (b.data.createdAt || 0));
    map.set(threadId, list);
  }
  return map;
});

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

const myIdentity = computed(() =>
  publicKeyPEM?.value ? stripIdentityKey(publicKeyPEM.value) : ""
);

const canAddItem = computed(
  () => bridge.flags.value.hasLedger && bridge.flags.value.authed
);

const selectedMode = shallowRef<"feed" | "dms">("feed");
const selectedFeedScopeId = shallowRef<string>("all");
const selectedFeedFilter = shallowRef<"all" | "public" | "private">("all");
const activePostId = shallowRef<string | null>(null);
const activeThreadId = shallowRef<string | null>(null);

const feedFilterOptions = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const isAddPostDialogOpen = ref(false);
const newPostBody = shallowRef("");
const postVisibility = shallowRef<"public" | "private">("public");
const selectedPostAudienceId = shallowRef<string>("");

const isCreateAudienceDialogOpen = ref(false);
const newAudienceTitle = shallowRef("");
const newAudienceMember = shallowRef<any | null>(null);
const newAudienceMembers = ref<any[]>([]);

const isMembersDialogOpen = ref(false);
const selectedUsersByPermission = reactive<Record<string, any>>({});

const isNewDmDialogOpen = ref(false);
const newDmMember = shallowRef<any | null>(null);
const newDmMembers = ref<any[]>([]);
const newDmMessage = shallowRef("");

const newCommentBody = shallowRef("");

const audienceGroups = computed(() =>
  permissions.value.map((group) => ({
    id: group.data.id,
    label: group.data.title,
    count: posts.value.filter(
      (item) =>
        item.data.permissionId === group.data.id ||
        item.data.permission === group.data.id
    ).length,
  }))
);

const selectedAudience = computed(
  () =>
    permissions.value.find(
      (group) => group.data.id === selectedFeedScopeId.value
    ) ?? null
);

const selectedThread = computed(
  () =>
    dmThreads.value.find((thread) => thread.data.id === activeThreadId.value) ??
    null
);

const selectedPermissionId = computed(() => {
  if (selectedMode.value === "feed") {
    return selectedAudience.value?.data.id ?? null;
  }
  return selectedThread.value?.data.permissionId ?? null;
});

const permissionMembers = computed(() => {
  if (!selectedPermissionId.value) return [];
  return permissionGrants.value.filter(
    (grant) => grant.data.permissionId === selectedPermissionId.value
  );
});

const scopedPosts = computed(() => {
  if (selectedFeedScopeId.value === "public") {
    return posts.value.filter(
      (item) => !item.data.permissionId && !item.data.permission
    );
  }
  if (selectedFeedScopeId.value === "all") return posts.value;
  return posts.value.filter(
    (item) =>
      item.data.permissionId === selectedFeedScopeId.value ||
      item.data.permission === selectedFeedScopeId.value
  );
});

const filteredPosts = computed(() => {
  if (selectedFeedFilter.value === "public") {
    return scopedPosts.value.filter(
      (item) => !item.data.permissionId && !item.data.permission
    );
  }
  if (selectedFeedFilter.value === "private") {
    return scopedPosts.value.filter(
      (item) => !!item.data.permissionId || !!item.data.permission
    );
  }
  return scopedPosts.value;
});

const activePost = computed(
  () =>
    filteredPosts.value.find((post) => post.data.id === activePostId.value) ??
    null
);

const activeComments = computed(() => {
  if (!activePost.value?.data?.id) return [];
  return commentsByPostId.value.get(activePost.value.data.id) ?? [];
});

const activeDmMessages = computed(() => {
  if (!activeThreadId.value) return [];
  return dmMessagesByThreadId.value.get(activeThreadId.value) ?? [];
});

const feedScopeLabel = computed(() => {
  if (selectedFeedScopeId.value === "public") return "Public";
  if (selectedAudience.value) return selectedAudience.value.data.title;
  return "All posts";
});

watch(
  filteredPosts,
  (nextPosts) => {
    if (!nextPosts.length) {
      activePostId.value = null;
      return;
    }
    const isActiveStillVisible = nextPosts.some(
      (item) => item.data.id === activePostId.value
    );
    if (!isActiveStillVisible) {
      activePostId.value = nextPosts[0].data.id;
    }
  },
  { immediate: true }
);

watch(
  dmThreads,
  (nextThreads) => {
    if (!nextThreads.length) {
      activeThreadId.value = null;
      return;
    }
    const isActiveStillVisible = nextThreads.some(
      (item) => item.data.id === activeThreadId.value
    );
    if (!isActiveStillVisible) {
      activeThreadId.value = nextThreads[0].data.id;
    }
  },
  { immediate: true }
);

watch(isAddPostDialogOpen, (nextValue) => {
  if (nextValue) return;
  newPostBody.value = "";
  postVisibility.value = "public";
  selectedPostAudienceId.value = "";
});

watch(isCreateAudienceDialogOpen, (nextValue) => {
  if (nextValue) return;
  newAudienceTitle.value = "";
  newAudienceMember.value = null;
  newAudienceMembers.value = [];
});

watch(isNewDmDialogOpen, (nextValue) => {
  if (nextValue) return;
  newDmMember.value = null;
  newDmMembers.value = [];
});

function openAddPostDialog() {
  if (!canAddItem.value) return;
  postVisibility.value = "public";
  selectedPostAudienceId.value = permissions.value[0]?.data.id ?? "";
  isAddPostDialogOpen.value = true;
}

function openCreateAudienceDialog() {
  if (!canAddItem.value) return;
  isCreateAudienceDialogOpen.value = true;
}

function openMembersDialog() {
  if (!selectedPermissionId.value) return;
  isMembersDialogOpen.value = true;
}

function openNewDmDialog() {
  if (!canAddItem.value) return;
  isNewDmDialogOpen.value = true;
}

function addAudienceMember() {
  if (!newAudienceMember.value) return;
  const next = newAudienceMember.value;
  const exists = newAudienceMembers.value.some(
    (member) => member?.publicIdentityKey === next?.publicIdentityKey
  );
  if (!exists) newAudienceMembers.value = [...newAudienceMembers.value, next];
  newAudienceMember.value = null;
}

async function createAudience() {
  const title = newAudienceTitle.value.trim();
  if (!title) return;
  const permission = await createPermission(title, "social");
  if (permission?.id && newAudienceMembers.value.length) {
    for (const member of newAudienceMembers.value) {
      if (!member?.publicIdentityKey || !member?.publicEncryptionKey) continue;
      await addUserPermission(
        permission.id,
        member.publicIdentityKey,
        member.publicEncryptionKey
      );
    }
  }
  if (permission?.id) {
    selectedFeedScopeId.value = permission.id;
    selectedPostAudienceId.value = permission.id;
  }
  isCreateAudienceDialogOpen.value = false;
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

async function addPost() {
  const body = newPostBody.value.trim();
  if (!body) return;
  if (!myIdentity.value) return;
  if (postVisibility.value === "private" && !selectedPostAudienceId.value)
    return;
  const permissionId =
    postVisibility.value === "private" ? selectedPostAudienceId.value : null;
  const id = generateId();
  await addItem(
    {
      id,
      body,
      authorId: myIdentity.value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    "posts",
    permissionId
  );
  activePostId.value = id;
  isAddPostDialogOpen.value = false;
}

async function addComment() {
  if (!activePost.value || activePost.value.data.keyMissing) return;
  const body = newCommentBody.value.trim();
  if (!body) return;
  if (!myIdentity.value) return;
  const permissionId =
    activePost.value.data.permissionId ??
    activePost.value.data.permission ??
    null;
  await addItem(
    {
      id: generateId(),
      postId: activePost.value.data.id,
      body,
      authorId: myIdentity.value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    "comments",
    permissionId
  );
  newCommentBody.value = "";
}

function addNewDmMember() {
  if (!newDmMember.value) return;
  const next = newDmMember.value;
  const exists = newDmMembers.value.some(
    (member) => member?.publicIdentityKey === next?.publicIdentityKey
  );
  if (!exists) newDmMembers.value = [...newDmMembers.value, next];
  newDmMember.value = null;
}

function buildDmTitle() {
  const names = newDmMembers.value.map(
    (member) => member?.name || member?.publicIdentityKey || "Member"
  );
  return `DM: ${names.join(", ")}`;
}

async function createDmThread() {
  if (!newDmMembers.value.length) return;
  const title = buildDmTitle();
  const permission = await createPermission(title, "social");
  if (!permission?.id) return;
  for (const member of newDmMembers.value) {
    if (!member?.publicIdentityKey || !member?.publicEncryptionKey) continue;
    await addUserPermission(
      permission.id,
      member.publicIdentityKey,
      member.publicEncryptionKey
    );
  }
  const threadId = generateId();
  await addItem(
    {
      id: threadId,
      title,
      permissionId: permission.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    "dm-threads",
    permission.id
  );
  activeThreadId.value = threadId;
  selectedMode.value = "dms";
  isNewDmDialogOpen.value = false;
}

async function sendDmMessage() {
  if (!selectedThread.value || selectedThread.value.data.keyMissing) return;
  const body = newDmMessage.value.trim();
  if (!body) return;
  if (!myIdentity.value) return;
  await addItem(
    {
      id: generateId(),
      threadId: selectedThread.value.data.id,
      body,
      authorId: myIdentity.value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    "dm-messages",
    selectedThread.value.data.permissionId
  );
  await addItem(
    {
      ...selectedThread.value.data,
      updatedAt: Date.now(),
    },
    "dm-threads",
    selectedThread.value.data.permissionId
  );
  newDmMessage.value = "";
}
</script>

<template>
  <div class="w-full flex flex-1 min-h-0 font-mono">
    <aside
      class="hidden lg:flex flex-col w-64 border-r border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 gap-4"
    >
      <div class="flex flex-col gap-2">
        <SListButton
          :active="selectedMode === 'feed'"
          variant="primary"
          @click="
            selectedMode = 'feed';
            selectedFeedScopeId = 'all';
          "
          size="sm"
        >
          Feed
        </SListButton>
        <SListButton
          :active="selectedMode === 'dms'"
          variant="primary"
          @click="selectedMode = 'dms'"
          size="sm"
        >
          DMs
        </SListButton>
      </div>

      <div v-if="selectedMode === 'feed'" class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs">
          <span class="uppercase tracking-[0.16em] opacity-60">
            Audiences
          </span>
          <Button
            type="button"
            size="xs"
            variant="plain-secondary"
            class="text-[11px] uppercase tracking-[0.12em]"
            @click="openCreateAudienceDialog"
          >
            New
          </Button>
        </div>
        <SListButton
          :active="selectedFeedScopeId === 'public'"
          variant="primary"
          :count="
            posts.filter(
              (item) => !item.data.permissionId && !item.data.permission
            ).length
          "
          @click="selectedFeedScopeId = 'public'"
          size="sm"
        >
          Public
        </SListButton>
        <SListButton
          v-for="group in audienceGroups"
          :key="group.id"
          :active="selectedFeedScopeId === group.id"
          variant="secondary"
          :count="group.count"
          @click="selectedFeedScopeId = group.id"
          size="sm"
        >
          <template #icon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-3 opacity-70"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </template>
          <span class="truncate">{{ group.label }}</span>
        </SListButton>
      </div>

      <div v-else class="flex flex-col gap-2">
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Threads
        </div>
        <SListButton
          v-for="thread in dmThreads"
          :key="thread.entryId"
          :active="activeThreadId === thread.data.id"
          variant="secondary"
          @click="activeThreadId = thread.data.id"
          size="sm"
        >
          <span class="truncate">
            {{
              thread.data.keyMissing
                ? "Insufficient permission"
                : thread.data.title
            }}
          </span>
        </SListButton>
        <div v-if="!dmThreads.length" class="text-xs opacity-60">
          No DMs yet.
        </div>
      </div>
    </aside>

    <section class="flex-1 flex flex-col gap-4 min-h-0">
      <header
        class="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-between px-4 py-3 backdrop-blur border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-bg) 90%, transparent)]"
      >
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-thin">
            {{ selectedMode === "feed" ? "Feed" : "DMs" }}
          </h2>
          <span class="text-xs text-[var(--ui-fg-muted)]">
            {{
              selectedMode === "feed"
                ? `${filteredPosts.length} posts · ${feedScopeLabel}`
                : `${dmThreads.length} threads`
            }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <SSegmentedControl
            v-if="selectedMode === 'feed'"
            v-model="selectedFeedFilter"
            :items="feedFilterOptions"
            size="xs"
            aria-label="Feed filter"
          />
          <Button
            v-if="selectedMode === 'feed'"
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            :disabled="!canAddItem"
            @click="openAddPostDialog"
          >
            <span
              class="flex items-center justify-center size-6 rounded-full border border-[var(--ui-border)]"
            >
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
            </span>
            New post
          </Button>
          <Button
            v-else
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            :disabled="!canAddItem"
            @click="openNewDmDialog"
          >
            <span
              class="flex items-center justify-center size-6 rounded-full border border-[var(--ui-border)]"
            >
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
            </span>
            New DM
          </Button>
          <Button
            v-if="selectedPermissionId"
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            @click="openMembersDialog"
          >
            <span
              class="flex items-center justify-center size-6 rounded-full border border-[var(--ui-border)]"
            >
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
            </span>
            Members ({{ permissionMembers.length }})
          </Button>
        </div>
      </header>

      <div class="lg:hidden flex gap-2 overflow-x-auto pb-2">
        <SListButton
          :active="selectedMode === 'feed'"
          variant="primary"
          size="sm"
          :full-width="false"
          class="shrink-0"
          @click="
            selectedMode = 'feed';
            selectedFeedScopeId = 'all';
          "
        >
          Feed
        </SListButton>
        <SListButton
          :active="selectedMode === 'dms'"
          variant="primary"
          size="sm"
          :full-width="false"
          class="shrink-0"
          @click="selectedMode = 'dms'"
        >
          DMs
        </SListButton>
        <template v-if="selectedMode === 'feed'">
          <SListButton
            :active="selectedFeedScopeId === 'public'"
            variant="primary"
            size="sm"
            :full-width="false"
            class="shrink-0"
            @click="selectedFeedScopeId = 'public'"
          >
            Public
          </SListButton>
          <SListButton
            v-for="group in audienceGroups"
            :key="group.id"
            :active="selectedFeedScopeId === group.id"
            variant="secondary"
            size="sm"
            :full-width="false"
            class="shrink-0"
            @click="selectedFeedScopeId = group.id"
          >
            {{ group.label }}
          </SListButton>
        </template>
        <template v-else>
          <SListButton
            v-for="thread in dmThreads"
            :key="thread.entryId"
            :active="activeThreadId === thread.data.id"
            variant="secondary"
            size="sm"
            :full-width="false"
            class="shrink-0"
            @click="activeThreadId = thread.data.id"
          >
            {{
              thread.data.keyMissing
                ? "Insufficient permission"
                : thread.data.title
            }}
          </SListButton>
        </template>
      </div>

      <div class="overflow-hidden flex-1">
        <div
          v-if="selectedMode === 'feed'"
          class="flex-1 min-h-0 flex flex-col xl:flex-row gap-3"
        >
          <div class="flex-1 overflow-auto min-h-0 flex flex-col gap-3">
            <ul
              class="w-full flex flex-col border-b border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))]"
            >
              <li
                v-for="post in filteredPosts"
                :key="post.entryId"
                class="border-b border-[var(--ui-border)] last:border-b-0"
              >
                <div
                  class="flex items-center gap-3 px-3 py-2 text-sm transition"
                  :class="
                    post.data.id === activePostId
                      ? 'bg-[var(--ui-surface-hover)]'
                      : 'hover:bg-[var(--ui-surface-hover)]/70'
                  "
                  @click="activePostId = post.data.id"
                >
                  <IdentityAvatar
                    v-if="!post.data.keyMissing && post.data.authorId"
                    :identity="
                      usersByIdentity.get(post.data.authorId)?.publicIdentityKey ||
                      post.data.authorId
                    "
                    size="sm"
                  />
                  <span
                    v-else
                    class="flex items-center justify-center size-7 rounded-full border border-[var(--ui-border)] text-[var(--ui-critical)] opacity-70"
                    aria-label="Insufficient permission"
                  >
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
                  </span>

                  <div class="flex-1 min-w-0">
                    <p class="truncate">
                      {{
                        post.data.keyMissing
                          ? "Insufficient permission"
                          : post.data.body
                      }}
                    </p>
                    <p v-if="post.data.authorId" class="text-xs text-[var(--ui-fg-muted)]">
                      {{
                        usersByIdentity.get(post.data.authorId)?.name ||
                        post.data.authorId
                      }}
                    </p>
                  </div>

                  <div
                    class="ml-auto flex items-center gap-2 text-xs text-[var(--ui-fg-muted)]"
                  >
                    <SBadge
                      v-if="post.data.permissionId || post.data.permission"
                      size="xs"
                      tone="secondary"
                      variant="outline"
                      class="flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="size-3"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                      Private
                    </SBadge>
                    <SBadge size="xs" tone="neutral" variant="outline">
                      {{
                        formatDate(post.data.createdAt, { dateStyle: "medium" })
                      }}
                    </SBadge>
                  </div>
                </div>
              </li>
              <li v-if="!filteredPosts.length" class="py-8 px-3 text-sm">
                <div
                  class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
                >
                  No posts yet. Share the first update.
                </div>
              </li>
            </ul>
          </div>

          <aside
            class="w-full xl:w-96 border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 92%, var(--ui-bg))] p-4 flex flex-col gap-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs uppercase tracking-[0.16em] opacity-60">
                  Post detail
                </p>
                <h3 class="text-base font-semibold truncate">
                  {{ activePost?.data?.keyMissing ? "Locked post" : "Post" }}
                </h3>
                <p class="text-xs text-[var(--ui-fg-muted)]">
                  {{ feedScopeLabel }}
                </p>
              </div>
            </div>

            <div v-if="!activePost" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Select a post to view details.
              </div>
            </div>

            <div v-else-if="activePost.data.keyMissing" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Insufficient permission to view this post.
              </div>
            </div>

            <template v-else>
              <div class="flex flex-col gap-3 text-sm">
                <div class="flex items-center gap-2 text-xs text-[var(--ui-fg-muted)]">
                  <IdentityAvatar
                    v-if="activePost.data.authorId"
                    :identity="
                      usersByIdentity.get(activePost.data.authorId)?.publicIdentityKey ||
                      activePost.data.authorId
                    "
                    size="xs"
                  />
                  <span>
                    {{
                      usersByIdentity.get(activePost.data.authorId)?.name ||
                      activePost.data.authorId ||
                      "Unknown author"
                    }}
                  </span>
                </div>
                <p class="text-[var(--ui-fg-muted)]">
                  {{ activePost.data.body }}
                </p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <SBadge
                    v-if="
                      activePost.data.permissionId || activePost.data.permission
                    "
                    size="xs"
                    tone="secondary"
                    variant="outline"
                  >
                    Private
                  </SBadge>
                  <SBadge size="xs" tone="neutral" variant="outline">
                    {{
                      formatDate(activePost.data.createdAt, {
                        dateStyle: "medium",
                      })
                    }}
                  </SBadge>
                </div>
              </div>

              <div class="flex items-center justify-between mt-2">
                <div>
                  <p class="text-xs uppercase tracking-[0.16em] opacity-60">
                    Comments
                  </p>
                  <p class="text-xs text-[var(--ui-fg-muted)]">
                    {{ activeComments.length }} entries
                  </p>
                </div>
              </div>

              <div v-if="activeComments.length" class="flex flex-col gap-2">
                <div
                  v-for="comment in activeComments"
                  :key="comment.entryId"
                  class="border border-[var(--ui-border)] p-3 text-xs"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <IdentityAvatar
                        v-if="comment.data.authorId"
                        :identity="
                          usersByIdentity.get(comment.data.authorId)?.publicIdentityKey ||
                          comment.data.authorId
                        "
                        size="xs"
                      />
                      <p class="font-semibold truncate">
                        {{
                          comment.data.keyMissing
                            ? "Insufficient permission"
                            : usersByIdentity.get(comment.data.authorId)?.name ||
                              comment.data.authorId ||
                              "Comment"
                        }}
                      </p>
                    </div>
                    <span class="text-[var(--ui-fg-muted)]">
                      {{
                        formatDate(comment.data.createdAt, {
                          dateStyle: "medium",
                        })
                      }}
                    </span>
                  </div>
                  <p class="mt-2 text-[var(--ui-fg-muted)]">
                    {{
                      comment.data.keyMissing
                        ? "Encrypted comment"
                        : comment.data.body
                    }}
                  </p>
                </div>
              </div>
              <div
                v-else
                class="border border-dashed border-[var(--ui-border)] px-3 py-4 text-xs text-[var(--ui-fg-muted)]"
              >
                No comments yet.
              </div>

              <div class="mt-3 flex flex-col gap-2">
                <textarea
                  v-model="newCommentBody"
                  rows="3"
                  class="border border-[var(--ui-border)] px-3 py-2 text-xs"
                  placeholder="Write a comment"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  @click="addComment"
                >
                  Add comment
                </Button>
              </div>
            </template>
          </aside>
        </div>

        <div v-else class="flex-1 min-h-0 flex flex-col">
          <div class="flex-1 overflow-auto min-h-0">
            <div v-if="!selectedThread" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Select a DM thread to view messages.
              </div>
            </div>
            <div v-else-if="selectedThread.data.keyMissing" class="text-sm">
              <div
                class="border border-dashed border-[var(--ui-border)] px-4 py-6 text-center text-[var(--ui-fg-muted)]"
              >
                Insufficient permission to view this conversation.
              </div>
            </div>
            <template v-else>
              <div v-if="activeDmMessages.length" class="flex flex-col gap-2">
                <div
                  v-for="message in activeDmMessages"
                  :key="message.entryId"
                  class="border border-[var(--ui-border)] p-3 text-xs"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <IdentityAvatar
                        v-if="message.data.authorId"
                        :identity="
                          usersByIdentity.get(message.data.authorId)?.publicIdentityKey ||
                          message.data.authorId
                        "
                        size="xs"
                      />
                      <p class="font-semibold truncate">
                        {{
                          message.data.keyMissing
                            ? "Insufficient permission"
                            : usersByIdentity.get(message.data.authorId)?.name ||
                              message.data.authorId ||
                              "Message"
                        }}
                      </p>
                    </div>
                    <span class="text-[var(--ui-fg-muted)]">
                      {{
                        formatDate(message.data.createdAt, {
                          dateStyle: "medium",
                        })
                      }}
                    </span>
                  </div>
                  <p class="mt-2 text-[var(--ui-fg-muted)]">
                    {{
                      message.data.keyMissing
                        ? "Encrypted message"
                        : message.data.body
                    }}
                  </p>
                </div>
              </div>
              <div
                v-else
                class="border border-dashed border-[var(--ui-border)] px-3 py-4 text-xs text-[var(--ui-fg-muted)]"
              >
                No messages yet.
              </div>
            </template>
          </div>
          <div class="border-t border-[var(--ui-border)] p-3 flex gap-2">
            <textarea
              v-model="newDmMessage"
              rows="2"
              class="flex-1 border border-[var(--ui-border)] px-3 py-2 text-xs"
              placeholder="Write a message"
              :disabled="!selectedThread || selectedThread.data.keyMissing"
            />
            <Button
              type="button"
              size="sm"
              variant="primary"
              :disabled="!selectedThread || selectedThread.data.keyMissing"
              @click="sendDmMessage"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </section>

    <SDialog v-model:open="isAddPostDialogOpen" size="lg" title="New post">
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
      <div class="flex flex-col gap-3">
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Post
        </label>
        <textarea
          v-model="newPostBody"
          rows="4"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="Share an update"
        />
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Visibility
        </div>
        <SSegmentedControl
          v-model="postVisibility"
          :items="[
            { value: 'public', label: 'Public' },
            { value: 'private', label: 'Private' },
          ]"
          size="xs"
        />
        <div v-if="postVisibility === 'private'" class="flex flex-col gap-2">
          <label class="text-xs uppercase tracking-[0.16em] opacity-60">
            Audience
          </label>
          <select
            v-model="selectedPostAudienceId"
            class="border border-[var(--ui-border)] px-3 py-2 text-sm"
          >
            <option value="">Select audience</option>
            <option
              v-for="group in audienceGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.label }}
            </option>
          </select>
          <Button
            type="button"
            size="xs"
            variant="secondary"
            @click="openCreateAudienceDialog"
          >
            Create audience
          </Button>
          <span class="text-xs text-[var(--ui-fg-muted)]">
            Private posts are visible only to audience members.
          </span>
        </div>
        <Button type="button" size="sm" variant="primary" @click="addPost">
          Publish post
        </Button>
      </div>
    </SDialog>

    <SDialog v-model:open="isCreateAudienceDialogOpen" title="Create audience">
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
      <div class="flex flex-col gap-3">
        <label class="text-xs uppercase tracking-[0.16em] opacity-60">
          Audience name
        </label>
        <input
          v-model="newAudienceTitle"
          type="text"
          class="border border-[var(--ui-border)] px-3 py-2"
          placeholder="e.g. Care team"
        />
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Add members
        </div>
        <div class="flex flex-col gap-2">
          <UserPicker v-model="newAudienceMember" />
          <Button
            type="button"
            size="xs"
            variant="secondary"
            @click="addAudienceMember"
          >
            Add member
          </Button>
          <div
            v-if="newAudienceMembers.length"
            class="flex flex-wrap items-center gap-2 text-xs"
          >
            <div
              v-for="member in newAudienceMembers"
              :key="member?.publicIdentityKey"
              class="flex items-center gap-2 border border-[var(--ui-border)] px-2 py-1"
            >
              <IdentityAvatar
                v-if="member?.publicIdentityKey"
                :identity="member.publicIdentityKey"
                size="xs"
              />
              <span class="max-w-[10rem] truncate">
                {{ member?.name || member?.publicIdentityKey }}
              </span>
              <Button
                type="button"
                size="xs"
                variant="plain-secondary"
                class="text-[11px] uppercase tracking-[0.12em]"
                @click="
                  newAudienceMembers = newAudienceMembers.filter(
                    (entry) =>
                      entry?.publicIdentityKey !== member?.publicIdentityKey
                  )
                "
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          @click="createAudience"
        >
          Create audience
        </Button>
      </div>
    </SDialog>

    <SDialog v-model:open="isNewDmDialogOpen" title="New DM">
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
      <div class="flex flex-col gap-3">
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Add participants
        </div>
        <div class="flex flex-col gap-2">
          <UserPicker v-model="newDmMember" />
          <Button
            type="button"
            size="xs"
            variant="secondary"
            @click="addNewDmMember"
          >
            Add member
          </Button>
          <div
            v-if="newDmMembers.length"
            class="flex flex-wrap items-center gap-2 text-xs"
          >
            <div
              v-for="member in newDmMembers"
              :key="member?.publicIdentityKey"
              class="flex items-center gap-2 border border-[var(--ui-border)] px-2 py-1"
            >
              <IdentityAvatar
                v-if="member?.publicIdentityKey"
                :identity="member.publicIdentityKey"
                size="xs"
              />
              <span class="max-w-[10rem] truncate">
                {{ member?.name || member?.publicIdentityKey }}
              </span>
              <Button
                type="button"
                size="xs"
                variant="plain-secondary"
                class="text-[11px] uppercase tracking-[0.12em]"
                @click="
                  newDmMembers = newDmMembers.filter(
                    (entry) =>
                      entry?.publicIdentityKey !== member?.publicIdentityKey
                  )
                "
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          @click="createDmThread"
        >
          Create DM
        </Button>
      </div>
    </SDialog>

    <SDialog
      v-if="selectedPermissionId"
      v-model:open="isMembersDialogOpen"
      :title="
        selectedAudience?.data.title || selectedThread?.data.title || 'Members'
      "
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
      <div class="flex flex-col gap-3">
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Add member
        </div>
        <div class="flex flex-col gap-2">
          <UserPicker
            v-model="selectedUsersByPermission[selectedPermissionId]"
          />
          <Button
            type="button"
            size="xs"
            variant="secondary"
            @click="addUserToPermission(selectedPermissionId)"
          >
            Add member
          </Button>
        </div>
        <div class="text-xs uppercase tracking-[0.16em] opacity-60">
          Members
        </div>
        <div
          v-if="permissionMembers.length"
          class="flex flex-wrap items-center gap-2 text-xs"
        >
          <div
            v-for="member in permissionMembers"
            :key="member.data.identity"
            class="flex items-center gap-2 border border-[var(--ui-border)] px-2 py-1"
          >
            <IdentityAvatar
              :identity="
                usersByIdentity.get(member.data.identity)?.publicIdentityKey ||
                member.data.identity
              "
              size="xs"
            />
            <span class="max-w-[12rem] truncate">
              {{
                usersByIdentity.get(member.data.identity)?.name ||
                member.data.identity
              }}
            </span>
          </div>
        </div>
        <div v-else class="text-xs opacity-60">No members yet.</div>
      </div>
    </SDialog>
  </div>
</template>
