export type TreeNode = {
  id: string;
  label: string;
  meta?: string;
  value?: string;
  rawValue?: unknown;
  tone?: "default" | "critical";
  badge?: string;
  children?: TreeNode[];
};
