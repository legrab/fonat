import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
export function InsightsPage() {
  const f = useQuery({
    queryKey: ["findings"],
    queryFn: () => api<any[]>("/api/findings"),
  });
  const e = useQuery({
    queryKey: ["evidence"],
    queryFn: () => api<any[]>("/api/evidence"),
  });
  const g = useQuery({
    queryKey: ["grades"],
    queryFn: () => api<any[]>("/api/grades"),
  });
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Bizonyítékból következő lépés</span>
          <h1>Elemzések</h1>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Megállapítások</h2>
          {f.data?.map((x) => (
            <article className="list-card" key={x.id}>
              <strong>{x.title}</strong>
              <span className={`chip ${x.severity || ""}`}>
                {x.severity || "info"}
              </span>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>Tanulási bizonyítékok</h2>
          {e.data?.map((x) => (
            <article className="list-card" key={x.id}>
              <div>
                <strong>{x.title}</strong>
                <small>{x.note || x.status}</small>
              </div>
            </article>
          ))}
        </section>
        <section className="panel span-two">
          <h2>Hivatalos jegyek</h2>
          {g.data?.length ? (
            g.data.map((x) => (
              <article className="list-card" key={x.id}>
                <strong>{x.title}</strong>
                <span className="grade">{x.value}</span>
              </article>
            ))
          ) : (
            <p className="muted">A felmérés értékelése után jelennek meg.</p>
          )}
        </section>
      </div>
    </>
  );
}
