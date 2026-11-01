import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { UtensilsCrossed } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="not-found">
      <PageHeader
        eyebrow="Niet gevonden"
        title="Pagina niet gevonden"
        description="Dit recept of onderdeel bestaat niet. Ga terug naar de
          verzameling om verder te koken."
      />
      <EmptyState
        icon={UtensilsCrossed}
        title="Hier is niets te zien"
        description="Probeer de pagina's Recepten, Categorieën of Bewaard."
      />
    </div>
  );
}
