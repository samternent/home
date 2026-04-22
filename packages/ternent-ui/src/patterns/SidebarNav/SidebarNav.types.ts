export type SidebarNavItem = {
  active?: boolean;
  dataTest?: string;
  disabled?: boolean;
  href?: string;
  id?: string;
  label: string;
  to?: string;
};

export type SidebarNavSection = {
  id?: string;
  items: SidebarNavItem[];
  label?: string;
};
