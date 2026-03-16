export type TreeNode = {
  id: string;
  label: string;
  meta?: string;
  value?: string;
  rawValue?: unknown;
  children?: TreeNode[];
};
