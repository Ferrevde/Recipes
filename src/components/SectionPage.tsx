import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { PageHeader } from "./PageHeader";

interface SectionPageProps {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
}

export function SectionPage(props: SectionPageProps) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={props.eyebrow}
        title={props.title}
        description={props.description}
      />
      <EmptyState
        icon={props.icon}
        title={props.emptyTitle}
        description={props.emptyDescription}
      />
    </div>
  );
}
