<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";

import UserPicker from "../../module/user/UserPicker.vue";

type PermissionGroup = {
  id: string;
  title: string;
  public: string;
  createdBy: string;
};

type PermissionGroupEntry = {
  entryId: string;
  data: PermissionGroup;
};

const props = defineProps<{
  permissions: PermissionGroupEntry[];
  onCreate: (payload: {
    title: string;
    assigneeId?: string | null;
    permissionId?: string | null;
  }) => Promise<void>;
  disabled?: boolean;
}>();

const rootRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);
const title = shallowRef("");
const selectedUser = shallowRef();
const permissionId = shallowRef<string | null>(null);
const errorMessage = shallowRef("");
const isSubmitting = ref(false);

const hasUnsavedChanges = computed(() => {
  return (
    title.value.trim().length > 0 ||
    !!selectedUser.value ||
    !!permissionId.value
  );
});

const isCollapsed = computed(
  () => !isExpanded.value && !hasUnsavedChanges.value
);

function expand() {
  if (props.disabled) return;
  isExpanded.value = true;
  errorMessage.value = "";
}

function collapse(force = false) {
  if (!force && hasUnsavedChanges.value) return;
  isExpanded.value = false;
  errorMessage.value = "";
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!rootRef.value) return;
  const target = event.target as Node;
  if (!rootRef.value.contains(target)) {
    collapse(false);
  }
}

async function submit() {
  const trimmedTitle = title.value.trim();
  if (!trimmedTitle) {
    errorMessage.value = "Title is required.";
    return;
  }
  errorMessage.value = "";
  isSubmitting.value = true;
  try {
    await props.onCreate({
      title: trimmedTitle,
      assigneeId: selectedUser.value?.id ?? null,
      permissionId: permissionId.value ?? null,
    });
    title.value = "";
    if (!title.value.trim()) {
      collapse(true);
    }
  } catch (error) {
    const message = (error as Error)?.message;
    errorMessage.value = message || "Unable to add task. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}

function onTitleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.stopPropagation();
    collapse(true);
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key === "ArrowDown") {
    event.preventDefault();
    expand();
    return;
  }
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});

watch(
  () => props.disabled,
  (value) => {
    if (value) collapse(true);
  }
);
</script>

<template>
  <div
    ref="rootRef"
    class="rounded-3xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 88%, var(--ui-bg))] transition-all duration-300"
    :class="
      isExpanded
        ? 'shadow-[0_18px_40px_rgba(0,0,0,0.14)]'
        : 'hover:border-[var(--ui-secondary)]/70'
    "
  >
    <div class="p-4 md:p-5 flex flex-col gap-3">
      <button
        v-if="isCollapsed"
        type="button"
        class="flex items-center gap-3 text-left text-sm opacity-70 hover:opacity-100 transition"
        :disabled="disabled"
        @click="expand"
      >
        <span
          class="size-10 rounded-full border border-[var(--ui-border)] flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </span>
        <span class="text-base font-thin">Add a task</span>
      </button>

      <div v-else class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="title"
            type="text"
            :disabled="disabled"
            class="flex-1 min-w-[12rem] border border-[var(--ui-border)] rounded-2xl px-3 py-2 bg-transparent"
            placeholder="What needs to get done?"
            aria-label="Todo title"
            @focus="expand"
            @keydown="onTitleKeydown"
          />

          <button
            type="button"
            class="px-4 py-2 rounded-full border border-[var(--ui-border)]"
            :disabled="isSubmitting"
            aria-label="Add todo"
            @click="submit"
          >
            Add
          </button>

          <button
            type="button"
            class="p-2 border border-[var(--ui-border)] rounded-full"
            aria-label="Toggle more options"
            @click="isExpanded ? collapse(true) : expand()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-4 transition-transform duration-300 transform-gpu"
              :class="!isExpanded ? 'rotate-0' : 'rotate-180'"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        <div v-if="isExpanded" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex flex-col gap-2">
            <label class="font-thin"> Assignee </label>
            <UserPicker v-model="selectedUser" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-thin"> Permissions </label>
            <select
              v-model="permissionId"
              class="border py-2 px-3 rounded-xl border-[var(--ui-border)] bg-transparent"
              aria-label="Todo permission"
            >
              <option :value="null">public</option>
              <option
                v-for="permission in permissions"
                :key="permission.data.id"
                :value="permission.data.id"
              >
                {{ permission.data.title }}
              </option>
            </select>
          </div>
        </div>
        <p
          v-if="errorMessage"
          class="text-xs text-red-500"
          role="alert"
          aria-live="assertive"
        >
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>
