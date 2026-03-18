<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { SBadge } from "ternent-ui/components";
import { Button } from "ternent-ui/primitives";

import UserPicker from "../../module/user/UserPicker.vue";

const props = defineProps<{
  onCreate: (payload: {
    title: string;
    assigneeId?: string | null;
    permissionId?: string | null;
    tasklistId?: string | null;
    boardColumnId?: string | null;
  }) => Promise<void>;
  disabled?: boolean;
  forceExpanded?: boolean;
  initialTitle?: string;
  initialAssignee?: { id?: string } | null;
  fixedListValue?: string | null;
  initialListValue?: string | null;
  listOptions?: {
    value: string;
    label: string;
    kind: "base" | "public-list" | "permission";
    id: string | null;
  }[];
  listLabel?: string | null;
  submitLabel?: string;
  boardColumns?: { id: string; title: string }[];
  fixedBoardColumnId?: string | null;
  initialBoardColumnId?: string | null;
}>();

const emit = defineEmits<{
  (event: "created"): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);
const title = shallowRef(props.initialTitle ?? "");
const selectedUser = shallowRef(props.initialAssignee ?? null);
const selectedListValue = shallowRef<string | null>(
  props.fixedListValue ?? props.initialListValue ?? null
);
const selectedBoardColumnId = shallowRef<string | null>(
  props.fixedBoardColumnId ?? props.initialBoardColumnId ?? null
);
const errorMessage = shallowRef("");
const isSubmitting = ref(false);

const hasListOptions = computed(() => (props.listOptions?.length ?? 0) > 0);

const hasBoardColumns = computed(
  () => (props.boardColumns?.length ?? 0) > 0
);

const selectedListLabel = computed(() => {
  if (!hasListOptions.value) return null;
  const match = props.listOptions?.find(
    (option) => option.value === selectedListValue.value
  );
  return match?.label ?? "Public";
});

const selectedBoardColumnLabel = computed(() => {
  if (!hasBoardColumns.value) return null;
  const match = props.boardColumns?.find(
    (column) => column.id === selectedBoardColumnId.value
  );
  return match?.title ?? "No column";
});

const hasUnsavedChanges = computed(() => {
  return title.value.trim().length > 0 || !!selectedUser.value;
});

const isExpandedView = computed(
  () => props.forceExpanded || isExpanded.value
);

const isCollapsed = computed(
  () => !isExpandedView.value && !hasUnsavedChanges.value
);

function expand() {
  if (props.disabled || props.forceExpanded) return;
  isExpanded.value = true;
  errorMessage.value = "";
}

function collapse(force = false) {
  if (props.forceExpanded) return;
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
      ...(selectedListValue.value?.startsWith("permission:")
        ? {
            permissionId:
              selectedListValue.value.replace("permission:", "") || null,
          }
        : {}),
      ...(selectedListValue.value?.startsWith("public-list:")
        ? {
            tasklistId:
              selectedListValue.value.replace("public-list:", "") || null,
          }
        : {}),
      boardColumnId:
        props.fixedBoardColumnId ?? selectedBoardColumnId.value ?? null,
    });
    emit("created");
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

watch(
  () => [props.fixedBoardColumnId, props.initialBoardColumnId],
  () => {
    selectedBoardColumnId.value =
      props.fixedBoardColumnId ?? props.initialBoardColumnId ?? null;
  }
);

watch(
  () => [props.fixedListValue, props.initialListValue],
  () => {
    selectedListValue.value =
      props.fixedListValue ?? props.initialListValue ?? null;
  }
);

watch(
  () => props.listOptions,
  (nextOptions) => {
    if (!nextOptions?.length) return;
    if (!selectedListValue.value) {
      selectedListValue.value = nextOptions[0].value;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div
    ref="rootRef"
    class="rounded-3xl border border-[var(--ui-border)] bg-[color-mix(in srgb, var(--ui-surface) 88%, var(--ui-bg))] transition-all duration-300"
    :class="
      isExpandedView
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
        <div class="flex flex-wrap items-start gap-3">
          <input
            v-model="title"
            type="text"
            :disabled="disabled"
            class="flex-1 min-w-[12rem] border border-[var(--ui-border)] rounded-sm px-3 py-2 bg-transparent"
            placeholder="What needs to get done?"
            aria-label="Task title"
            @focus="expand"
            @keydown="onTitleKeydown"
          />

          <Button
            type="button"
            size="sm"
            variant="secondary"
            class="!rounded-full"
            :disabled="isSubmitting"
            aria-label="Add task"
            @click="submit"
          >
            {{ submitLabel ?? "Add" }}
          </Button>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="uppercase tracking-[0.16em] opacity-60">List</span>
          <SBadge size="xs" tone="neutral" variant="outline">
            {{
              selectedListLabel ??
              listLabel ??
              "Public"
            }}
          </SBadge>
          <template v-if="hasBoardColumns">
            <span class="uppercase tracking-[0.16em] opacity-60">
              Board column
            </span>
            <SBadge size="xs" tone="neutral" variant="outline">
              {{ selectedBoardColumnLabel }}
            </SBadge>
          </template>
        </div>
        <div
          v-if="isExpandedView"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div v-if="hasListOptions" class="flex flex-col gap-2">
            <label class="font-thin"> List </label>
            <select
              v-model="selectedListValue"
              :disabled="disabled || !!fixedListValue"
              class="border border-[var(--ui-border)] px-3 py-2 bg-transparent"
            >
              <option
                v-for="option in listOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-thin"> Assignee </label>
            <UserPicker v-model="selectedUser" />
          </div>
          <div v-if="hasBoardColumns" class="flex flex-col gap-2">
            <label class="font-thin"> Board column </label>
            <select
              v-model="selectedBoardColumnId"
              :disabled="disabled || !!fixedBoardColumnId"
              class="border border-[var(--ui-border)] px-3 py-2 bg-transparent"
            >
              <option :value="null">No column</option>
              <option
                v-for="column in boardColumns"
                :key="column.id"
                :value="column.id"
              >
                {{ column.title }}
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
