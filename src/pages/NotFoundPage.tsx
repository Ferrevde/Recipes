import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { UtensilsCrossed } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="not-found">
      <PageHeader
        eyebrow="Not here"
        title="Page not found"
        description="This recipe or section doesn’t exist. Head back to the
          collection to keep cooking."
      />
      <EmptyState
        icon={UtensilsCrossed}
        title="Nothing to see here"
        description="Try the Recipes, Categories, or Saved pages."
      />
    </div>
  );
}
