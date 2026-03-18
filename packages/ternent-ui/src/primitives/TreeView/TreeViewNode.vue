<script setup lang="ts">
import { computed, ref } from "vue";
import { TreeView } from "@ark-ui/vue/tree-view";
import type { TreeCollection } from "@ark-ui/vue/tree-view";
import Badge from "../Badge/Badge.vue";
import type { TreeNode } from "./TreeView.types";

defineOptions({ name: "TreeViewNode" });

const props = withDefaults(
  defineProps<{
    node: TreeNode;
    collection: TreeCollection<TreeNode>;
    indexPath: number[];
    level?: number;
    editableValues?: boolean;
    onValueEdit?: (path: string, raw: string) => void;
  }>(),
  {
    level: 0,
    editableValues: false,
    onValueEdit: undefined,
  },
);

const hasChildren = computed(() => props.collection.isBranchNode(props.node));
const childNodes = computed(() => props.collection.getNodeChildren(props.node));
const rowStyle = computed(() => ({
  paddingLeft: `${props.level * 16}px`,
  color: props.node.tone === "critical" ? "var(--ui-critical)" : undefined,
}));
const rowToneClass = computed(() =>
  props.node.tone === "critical"
    ? "border border-[color-mix(in_srgb,var(--ui-critical)_18%,transparent)] bg-[color-mix(in_srgb,var(--ui-critical-muted)_65%,transparent)]"
    : "border border-transparent",
);
const labelToneClass = computed(() =>
  props.node.tone === "critical"
    ? "text-[var(--ui-text)]"
    : "text-[var(--ui-text)]",
);
const valueToneClass = computed(() =>
  props.node.tone === "critical"
    ? "text-[var(--ui-text-muted)]"
    : "text-[var(--ui-text-muted)]",
);
const textStyle = computed(() =>
  props.node.tone === "critical" ? { color: "var(--ui-critical)" } : undefined,
);

const isEditingValue = ref(false);
const draftValue = ref("");

const hasRawValue = computed(() =>
  Object.prototype.hasOwnProperty.call(props.node, "rawValue"),
);

function formatRawValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) return "null";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
}

function beginValueEdit() {
  if (!props.editableValues || !props.onValueEdit || !hasRawValue.value) return;
  draftValue.value = formatRawValue(props.node.rawValue);
  isEditingValue.value = true;
}

function commitValueEdit() {
  if (!isEditingValue.value) return;
  isEditingValue.value = false;
  if (!props.onValueEdit) return;
  props.onValueEdit(props.node.id, draftValue.value);
}

function cancelValueEdit() {
  isEditingValue.value = false;
  draftValue.value = "";
}
</script>

<template>
  <TreeView.NodeProvider :node="node" :index-path="indexPath">
    <TreeView.NodeContext v-slot="context">
      <TreeView.Branch v-if="hasChildren">
        <TreeView.BranchControl
          :style="rowStyle"
          class="group flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-[var(--ui-border)]"
          :class="rowToneClass"
        >
          <TreeView.BranchTrigger class="flex items-center gap-2">
            <TreeView.BranchIndicator>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-3 w-3 transition-transform duration-200"
                :class="{ 'rotate-90': context.expanded }"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.24 4.24a.75.75 0 0 1 0 1.06l-4.24 4.24a.75.75 0 0 1-1.08 0Z"
                  clip-rule="evenodd"
                />
              </svg>
            </TreeView.BranchIndicator>
            <TreeView.BranchText
              class="flex-1 truncate"
              :class="[labelToneClass, { 'font-semibold': context.selected }]"
              :style="textStyle"
            >
              {{ node.label }}
            </TreeView.BranchText>
          </TreeView.BranchTrigger>
          <Badge
            v-if="node.badge"
            tone="critical"
            variant="soft"
            size="xs"
          >
            {{ node.badge }}
          </Badge>
          <input
            v-if="editableValues && hasRawValue && isEditingValue"
            v-model="draftValue"
            class="ml-auto max-w-[55%] rounded border border-[var(--ui-border)] bg-transparent px-2 py-1 text-[0.85em]"
            @keydown.enter.prevent="commitValueEdit"
            @keydown.esc.prevent="cancelValueEdit"
            @blur="commitValueEdit"
          />
          <span
            v-else-if="node.value || node.meta"
            class="ml-auto max-w-[55%] truncate text-[0.85em]"
            :class="valueToneClass"
            :style="textStyle"
            @dblclick.stop="beginValueEdit"
          >
            {{ node.value || node.meta }}
          </span>
        </TreeView.BranchControl>
        <TreeView.BranchContent class="space-y-1">
          <TreeView.Tree class="space-y-1">
            <TreeViewNode
              v-for="(child, childIndex) in childNodes"
              :key="child.id"
              :node="child"
              :collection="collection"
              :index-path="[...indexPath, childIndex]"
              :level="level + 1"
              :editable-values="editableValues"
              :on-value-edit="onValueEdit"
            />
          </TreeView.Tree>
        </TreeView.BranchContent>
      </TreeView.Branch>

      <TreeView.Item
        v-else
        :style="rowStyle"
        class="group flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition hover:bg-[var(--ui-border)]"
        :class="rowToneClass"
      >
        <TreeView.ItemText
          class="flex-1 truncate"
          :class="[labelToneClass, { 'font-semibold': context.selected }]"
          :style="textStyle"
        >
          {{ node.label }}
        </TreeView.ItemText>
        <Badge
          v-if="node.badge"
          tone="critical"
          variant="soft"
          size="xs"
        >
          {{ node.badge }}
        </Badge>
        <input
          v-if="editableValues && hasRawValue && isEditingValue"
          v-model="draftValue"
          class="ml-auto max-w-[55%] rounded border border-[var(--ui-border)] bg-transparent px-2 py-1 text-[0.85em]"
          @keydown.enter.prevent="commitValueEdit"
          @keydown.esc.prevent="cancelValueEdit"
          @blur="commitValueEdit"
        />
        <span
          v-else-if="node.value || node.meta"
          class="ml-auto max-w-[55%] truncate text-[0.85em]"
          :class="valueToneClass"
          :style="textStyle"
          @dblclick.stop="beginValueEdit"
        >
          {{ node.value || node.meta }}
        </span>
      </TreeView.Item>
    </TreeView.NodeContext>
  </TreeView.NodeProvider>
</template>
