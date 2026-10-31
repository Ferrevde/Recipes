import {
  BookOpen,
  Bookmark,
  ListFilter,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", path: "/", icon: Gauge },
  { label: "Recipes", path: "/recipes", icon: BookOpen },
  { label: "Categories", path: "/categories", icon: ListFilter },
  { label: "Saved", path: "/saved", icon: Bookmark },
];
