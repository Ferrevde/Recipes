import { ChefHat, UtensilsCrossed, Bookmark } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

interface PreferenceRow {
  label: string;
  value: string;
  icon: typeof ChefHat;
}

const PREFERENCES: PreferenceRow[] = [
  {
    label: "Favorite category",
    value: "Dinner",
    icon: UtensilsCrossed,
  },
  {
    label: "Total recipes",
    value: "12",
    icon: ChefHat,
  },
  {
    label: "Saved recipes",
    value: "0",
    icon: Bookmark,
  },
];

export function ProfilePage() {
  return (
    <div className="profile-page">
      <PageHeader
        eyebrow="Your book"
        title="Profile"
        description="A quick look at how you use your recipe collection."
      />

      <section className="profile-card">
        <h2>Quick stats</h2>
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
        <h2>About the collection</h2>
        <p className="profile-card__text">
          Recipe Book keeps everything in one place: browse by category, search
          by name or ingredient, and save the recipes you want to cook again.
          Add your own recipes to grow the collection over time.
        </p>
      </section>
    </div>
  );
}
