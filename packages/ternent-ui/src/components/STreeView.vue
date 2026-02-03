<script setup lang="ts">
import { TreeView, createTreeCollection } from "@ark-ui/vue/tree-view";
import type { TreeCollection } from "@ark-ui/vue/tree-view";
import { computed } from "vue";
import STreeViewNode from "./STreeViewNode.vue";

export type TreeNode = {
  id: string;
  label: string;
  meta?: string;
  value?: string;
  rawValue?: unknown;
  children?: TreeNode[];
};

const props = withDefaults(
  defineProps<{
    nodes: TreeNode[];
    ariaLabel?: string;
    selectionMode?: "single" | "multiple";
    defaultExpandedDepth?: number;
    editableValues?: boolean;
    textSize?: "xs" | "sm" | "md" | "lg";
  }>(),
  {
    ariaLabel: "Tree view",
    selectionMode: "single",
    defaultExpandedDepth: 1,
    editableValues: false,
    textSize: "sm",
  }
);

const emit = defineEmits<{
  (event: "value-change", payload: { path: string; raw: string }): void;
}>();

const hasNodes = computed(() => props.nodes?.length > 0);

const collection = computed<TreeCollection<TreeNode>>(() =>
  createTreeCollection<TreeNode>({
    rootNode: {
      id: "root",
      label: props.ariaLabel,
      children: props.nodes ?? [],
    },
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.label,
    nodeToChildren: (node) => node.children ?? [],
  })
);

const rootNodes = computed(() =>
  collection.value.getNodeChildren(collection.value.rootNode)
);

function collectExpandedValues(
  nodes: TreeNode[],
  maxDepth: number,
  depth = 0,
  acc: string[] = []
) {
  if (maxDepth <= 0 || depth >= maxDepth) return acc;
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      acc.push(node.id);
      collectExpandedValues(node.children, maxDepth, depth + 1, acc);
    }
  }
  return acc;
}

const defaultExpandedValue = computed(() =>
  collectExpandedValues(props.nodes ?? [], props.defaultExpandedDepth)
);

function handleValueEdit(path: string, raw: string) {
  emit("value-change", { path, raw });
}
</script>

<template>
  <TreeView.Root
    :aria-label="ariaLabel"
    :collection="collection"
    :selection-mode="selectionMode"
    :default-expanded-value="defaultExpandedValue"
    class="w-full text-[var(--ui-text)]"
    :class="{
      'text-xs': textSize === 'xs',
      'text-sm': textSize === 'sm',
      'text-base': textSize === 'md',
      'text-lg': textSize === 'lg',
    }"
  >
    <TreeView.Tree class="space-y-1">
      <template v-if="hasNodes">
        <STreeViewNode
          v-for="(node, index) in rootNodes"
          :key="node.id"
          :node="node"
          :collection="collection"
          :index-path="[index]"
          :editable-values="editableValues"
          :on-value-edit="handleValueEdit"
        />
      </template>
      <p v-else class="text-xs opacity-60">No nodes to display.</p>
    </TreeView.Tree>
  </TreeView.Root>
</template>
