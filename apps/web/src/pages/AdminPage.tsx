import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, patch, post } from "../api";
import { supportedLocales, useI18n } from "../i18n";

export function AdminPage() {
  const qc = useQueryClient();
  const { locale, setLocale, t } = useI18n();
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => api<any[]>("/api/admin/users"),
  });
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api<any>("/api/admin/health"),
  });
  const features = useQuery({
    queryKey: ["features"],
    queryFn: () => api<any>("/api/admin/features"),
  });
  const [email, setEmail] = useState("tanar@example.com");
  const create = useMutation({
    mutationFn: () =>
      post("/api/admin/users", {
        email,
        displayName: t("admin.newTeacher"),
        password: "temporary123",
        roles: ["teacher"],
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
  const reset = useMutation({
    mutationFn: (mode: string) => post("/api/packages/demo-reset", { mode }),
    onSuccess: () => {
      qc.invalidateQueries();
      location.href = "/";
    },
  });
  const toggle = useMutation({
    mutationFn: (projects: boolean) =>
      patch("/api/admin/features", { projects }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["features"] }),
  });
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">{t("admin.eyebrow")}</span>
          <h1>{t("admin.title")}</h1>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>{t("admin.users")}</h2>
          {users.data?.map((u) => (
            <article className="list-card" key={u.id}>
              <div>
                <strong>{u.displayName}</strong>
                <small>
                  {u.email} · {u.roles.join(", ")}
                </small>
              </div>
              <span className="chip">
                {u.disabled ? t("admin.disabled") : t("admin.active")}
              </span>
            </article>
          ))}
          <div className="inline-form">
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={() => create.mutate()}>
              {t("admin.createTeacher")}
            </button>
          </div>
        </section>
        <section className="panel stack">
          <h2>{t("admin.systemStatus")}</h2>
          <pre>{JSON.stringify(health.data, null, 2)}</pre>
          <label className="switch">
            <input
              type="checkbox"
              checked={Boolean(features.data?.projects)}
              onChange={(e) => toggle.mutate(e.target.checked)}
            />{" "}
            {t("admin.projectFeature")}
          </label>
          <label>
            {t("admin.interfaceLanguage")}
            <select
              value={locale}
              onChange={(event) =>
                setLocale(event.target.value as typeof locale)
              }
            >
              {supportedLocales.map((value) => (
                <option key={value} value={value}>
                  {t(`language.${value}`)}
                </option>
              ))}
            </select>
          </label>
          <small className="muted">{t("admin.languageHelp")}</small>
        </section>
        <section className="panel span-two">
          <h2>{t("admin.resetData")}</h2>
          <p>{t("admin.resetBody")}</p>
          <div className="row-actions">
            <button className="secondary" onClick={() => reset.mutate("blank")}>
              {t("admin.blankWorkspace")}
            </button>
            <button onClick={() => reset.mutate("demo")}>
              {t("admin.reloadDemo")}
            </button>
            <a className="button secondary" href="/api/packages/export">
              {t("admin.jsonExport")}
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
