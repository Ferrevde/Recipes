import {
  BookOpen,
  Bookmark,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { label: "Recepten", path: "/recipes", icon: BookOpen },
  { label: "Weekmenu", path: "/weekmenu", icon: CalendarDays },
  { label: "Bewaard", path: "/saved", icon: Bookmark },
];
