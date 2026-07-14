import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, post } from "../api";
import { Logo } from "../components/Logo";
export function LoginPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => api<any>("/api/auth/status"),
  });
  const [email, setEmail] = useState("admin@fonat.local");
  const [password, setPassword] = useState("fonat-demo");
  const [displayName, setDisplayName] = useState("Első tanár");
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await post(
        status.data?.requiresBootstrap
          ? "/api/auth/bootstrap"
          : "/api/auth/login",
        status.data?.requiresBootstrap
          ? { email, password, displayName }
          : { email, password },
      );
      if (status.data?.requiresBootstrap)
        await post("/api/auth/login", { email, password });
      await qc.invalidateQueries();
      nav("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sikertelen belépés");
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <Logo />
        <div>
          <span className="eyebrow">Oktatási műhely</span>
          <h1>
            {status.data?.requiresBootstrap
              ? "Első admin létrehozása"
              : "Belépés a munkatérbe"}
          </h1>
          <p>Az oktatás minden szála egy helyen.</p>
        </div>
        <form onSubmit={submit} className="stack">
          {status.data?.requiresBootstrap && (
            <label>
              Név
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Jelszó
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit">
            {status.data?.requiresBootstrap
              ? "Munkatér létrehozása"
              : "Belépés"}
          </button>
        </form>
        <small>Demo: admin@fonat.local / fonat-demo</small>
      </div>
    </div>
  );
}
