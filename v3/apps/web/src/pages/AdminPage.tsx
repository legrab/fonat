import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, patch, post } from "../api";
export function AdminPage() {
  const qc = useQueryClient();
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
        displayName: "Új tanár",
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
          <span className="eyebrow">Munkatér-felügyelet</span>
          <h1>Admin</h1>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Felhasználók</h2>
          {users.data?.map((u) => (
            <article className="list-card" key={u.id}>
              <div>
                <strong>{u.displayName}</strong>
                <small>
                  {u.email} · {u.roles.join(", ")}
                </small>
              </div>
              <span className="chip">{u.disabled ? "letiltva" : "aktív"}</span>
            </article>
          ))}
          <div className="inline-form">
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
            <button onClick={() => create.mutate()}>Tanár létrehozása</button>
          </div>
        </section>
        <section className="panel">
          <h2>Rendszerállapot</h2>
          <pre>{JSON.stringify(health.data, null, 2)}</pre>
          <label className="switch">
            <input
              type="checkbox"
              checked={Boolean(features.data?.projects)}
              onChange={(e) => toggle.mutate(e.target.checked)}
            />{" "}
            Projekt képesség
          </label>
        </section>
        <section className="panel span-two">
          <h2>Adatok visszaállítása</h2>
          <p>
            A tanári fiókok és az aktív munkamenet megmaradnak. A munkatér
            tartalma újraépül.
          </p>
          <div className="row-actions">
            <button className="secondary" onClick={() => reset.mutate("blank")}>
              Üres munkatér
            </button>
            <button onClick={() => reset.mutate("demo")}>
              Demo újratöltése
            </button>
            <a className="button secondary" href="/api/packages/export">
              JSON export
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
