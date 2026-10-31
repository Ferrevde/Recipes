import { BookOpen, ChefHat } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { navigationItems } from "./navigation";

function Brand() {
  return (
    <div className="brand" aria-label="Recipe Book">
      <span className="brand__mark" aria-hidden="true">
        <ChefHat size={22} strokeWidth={2.4} />
      </span>
      <span>
        <strong>Recipe Book</strong>
        <small>Personal recipe collection</small>
      </span>
    </div>
  );
}

function Navigation({ variant }: { variant: "sidebar" | "bottom" }) {
  return (
    <nav
      className={`navigation navigation--${variant}`}
      aria-label="Primary navigation"
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
      aria-label="Profile & Preferences"
      className={({ isActive }) =>
        compact
          ? `mobile-profile-link${isActive ? " is-active" : ""}`
          : `navigation__link profile-link${isActive ? " is-active" : ""}`
      }
      to="/profile"
    >
      <BookOpen aria-hidden="true" size={20} strokeWidth={2} />
      {!compact && <span>Profile</span>}
    </NavLink>
  );
}

export function AppShell() {
  const location = useLocation();
  const hideAddButton =
    location.pathname === "/profile" ||
    location.pathname === "/categories" ||
    location.pathname === "/saved";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <Navigation variant="sidebar" />
        <div className="sidebar__status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{navigationItems.length} categories ready</strong>
            <span>Ready to cook. Add your own recipes anytime.</span>
          </div>
        </div>
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
          aria-label="Add a recipe"
          title="Add a recipe will be added in a future step"
          disabled
        >
          <BookOpen aria-hidden="true" size={22} />
          <span>Add</span>
        </button>
      )}

      <Navigation variant="bottom" />
    </div>
  );
}
