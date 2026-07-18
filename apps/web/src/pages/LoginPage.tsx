import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, post } from "../api";
import { Logo } from "../components/Logo";
import { useI18n } from "../i18n";

export function LoginPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { t } = useI18n();
  const status = useQuery({
    queryKey: ["auth-status"],
    queryFn: () => api<any>("/api/auth/status"),
  });
  const [email, setEmail] = useState("admin@fonat.local");
  const [password, setPassword] = useState("fonat-demo");
  const [displayName, setDisplayName] = useState(() =>
    t("login.defaultDisplayName"),
  );
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
      setError(err instanceof Error ? err.message : t("login.failure"));
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <Logo />
        <div>
          <span className="eyebrow">{t("login.eyebrow")}</span>
          <h1>
            {status.data?.requiresBootstrap
              ? t("login.bootstrapTitle")
              : t("login.title")}
          </h1>
          <p>{t("login.tagline")}</p>
        </div>
        <form onSubmit={submit} className="stack">
          {status.data?.requiresBootstrap && (
            <label>
              {t("login.name")}
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          )}
          <label>
            {t("login.email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            {t("login.password")}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit">
            {status.data?.requiresBootstrap
              ? t("login.createWorkspace")
              : t("login.signIn")}
          </button>
        </form>
        <small>{t("login.demo")}</small>
      </div>
    </div>
  );
}
