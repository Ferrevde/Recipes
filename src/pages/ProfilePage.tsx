import { ChefHat, UtensilsCrossed, Bookmark } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

interface PreferenceRow {
  label: string;
  value: string;
  icon: typeof ChefHat;
}

const PREFERENCES: PreferenceRow[] = [
  {
    label: "Favoriete categorie",
    value: "Diner",
    icon: UtensilsCrossed,
  },
  {
    label: "Totaal aantal recepten",
    value: "12",
    icon: ChefHat,
  },
  {
    label: "Bewaarde recepten",
    value: "0",
    icon: Bookmark,
  },
];

export function ProfilePage() {
  return (
    <div className="profile-page">
      <PageHeader
        eyebrow="Jouw boek"
        title="Profiel"
        description="Een kort overzicht van je receptenverzameling."
      />

      <section className="profile-card">
        <h2>Snelle statistieken</h2>
        <dl className="profile-preferences">
          {PREFERENCES.map((row) => (
            <div key={row.label} className="profile-preference">
              <dt>
                <row.icon aria-hidden="true" size={16} strokeWidth={2} />
                {row.label}
              </dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="profile-card">
        <h2>Over de verzameling</h2>
        <p className="profile-card__text">
          Receptenboek houdt alles op één plek: blader per categorie, zoek op
          naam of ingrediënt en bewaar recepten die je opnieuw wilt koken. Voeg
          je eigen recepten toe om de verzameling verder uit te bouwen.
        </p>
      </section>
    </div>
  );
}
