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
  { label: "Overzicht", path: "/", icon: Gauge },
  { label: "Recepten", path: "/recipes", icon: BookOpen },
  { label: "Categorieën", path: "/categories", icon: ListFilter },
  { label: "Bewaard", path: "/saved", icon: Bookmark },
];
