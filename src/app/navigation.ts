import { BookOpen, Bookmark, type LucideIcon } from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { label: "Recepten", path: "/recipes", icon: BookOpen },
  { label: "Bewaard", path: "/saved", icon: Bookmark },
];
