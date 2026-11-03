import { BookOpen, ChefHat } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { navigationItems } from "./navigation";

function Brand() {
  return (
    <div className="brand" aria-label="Receptenboek">
      <span className="brand__mark" aria-hidden="true">
        <ChefHat size={22} strokeWidth={2.4} />
      </span>
      <span>
        <strong>Receptenboek</strong>
        <small>Persoonlijke receptenverzameling</small>
      </span>
    </div>
  );
}

function Navigation({ variant }: { variant: "sidebar" | "bottom" }) {
  return (
    <nav
      className={`navigation navigation--${variant}`}
      aria-label="Hoofdnavigatie"
    >
      {navigationItems.map(({ label, path, icon: Icon }) => (
        <NavLink
          aria-label={label}
          className={({ isActive }) =>
            `navigation__link${isActive ? " is-active" : ""}`
          }
          end={path === "/"}
          key={path}
          to={path}
        >
          <Icon aria-hidden="true" size={20} strokeWidth={2} />
          <span>{variant === "bottom" ? label : label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function ProfileLink({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink
      aria-label="Profiel en voorkeuren"
      className={({ isActive }) =>
        compact
          ? `mobile-profile-link${isActive ? " is-active" : ""}`
          : `navigation__link profile-link${isActive ? " is-active" : ""}`
      }
      to="/profile"
    >
      <BookOpen aria-hidden="true" size={20} strokeWidth={2} />
      {!compact && <span>Profiel</span>}
    </NavLink>
  );
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideAddButton =
    location.pathname === "/profile" || location.pathname === "/saved";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <Navigation variant="sidebar" />
        <ProfileLink />
      </aside>

      <div className="app-shell__content">
        <header className="mobile-header">
          <Brand />
          <ProfileLink compact />
        </header>
        <main className="page-container">
          <Outlet />
        </main>
      </div>

      {!hideAddButton && (
        <button
          className="add-button"
          type="button"
          aria-label="Recept toevoegen"
          title="Recept toevoegen"
          onClick={() => navigate("/recipes/new")}
        >
          <BookOpen aria-hidden="true" size={22} />
          <span>Toevoegen</span>
        </button>
      )}

      <Navigation variant="bottom" />
    </div>
  );
}
