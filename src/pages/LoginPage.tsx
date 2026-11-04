import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../features/auth/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const returnTo =
    new URLSearchParams(location.search).get("returnTo") ?? "/recipes";

  useEffect(() => {
    if (user) {
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate(returnTo, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Er ging iets mis.");
    }
  }

  if (isLoading) {
    return <p className="loading-state">Account laden…</p>;
  }

  return (
    <div className="auth-page">
      <PageHeader
        eyebrow="Mijn account"
        title={isRegistering ? "Account aanmaken" : "Inloggen"}
        description="Log in om je favorieten en persoonlijke weekmenu op elk apparaat te bewaren."
      />
      <form className="auth-card" onSubmit={submit}>
        {error && <p className="alert alert--error">{error}</p>}
        <label className="form-field">
          <span>E-mailadres</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Wachtwoord</span>
          <input
            type="password"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary-button" type="submit">
          {isRegistering ? "Account aanmaken" : "Inloggen"}
        </button>
        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setIsRegistering((current) => !current);
            setError(null);
          }}
        >
          {isRegistering
            ? "Ik heb al een account"
            : "Nog geen account? Aanmelden"}
        </button>
      </form>
      <Link className="back-link" to="/recipes">
        Terug naar recepten
      </Link>
    </div>
  );
}
