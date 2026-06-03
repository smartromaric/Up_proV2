import type { NavIconName } from "./NavIcon";

export interface NavItem {
  label: string;
  path: string;
  icon?: NavIconName;
  permission: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}
