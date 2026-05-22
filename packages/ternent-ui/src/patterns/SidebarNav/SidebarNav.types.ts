export type SidebarNavItem = {
  active?: boolean;
  count?: number | string;
  dataTest?: string;
  disabled?: boolean;
  href?: string;
  id?: string;
  label: string;
  showActiveDot?: boolean;
  to?: string;
};

export type SidebarNavSection = {
  id?: string;
  items: SidebarNavItem[];
  label?: string;
};
