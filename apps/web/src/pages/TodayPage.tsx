import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api";
export function TodayPage() {
  const q = useQuery({
    queryKey: ["today"],
    queryFn: () => api<any>("/api/today"),
    refetchInterval: 5000,
  });
  const onboarding = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => api<any>("/api/onboarding/status"),
  });
  if (q.isLoading) return <div className="loading">Betöltés…</div>;
  const d = q.data;
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">{d?.date}</span>
          <h1>Ma a szálak összeérnek.</h1>
          <p>
            Órák, beadandók, bizonyítékok és következő lépések egy nyugodt
            munkafelületen.
          </p>
        </div>
        {onboarding.data?.complete ? (
          <Link className="button" to="/lessons/new">
            Új óraterv
          </Link>
        ) : (
          <Link className="button" to="/setup">
            Beállítás befejezése
          </Link>
        )}
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>Gyors kezdés</h2>
          <Link to="/guide/getting-started">Első lépések</Link>
        </div>
        <div className="card-row">
          <Link className="metric-card" to="/library/new?type=concept">
            <span className="eyebrow">Tartalom</span>
            <strong>Új fogalom</strong>
            <small>Definíció és kapcsolatok</small>
          </Link>
          <Link className="metric-card" to="/exercises/new">
            <span className="eyebrow">Gyakorlás</span>
            <strong>Új gyakorlófeladat</strong>
            <small>Hat támogatott feladattípus</small>
          </Link>
          <Link className="metric-card" to="/lessons/new">
            <span className="eyebrow">Tervezés</span>
            <strong>Új óraterv</strong>
            <small>Tananyag, feladat és élő ellenőrzés</small>
          </Link>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-head">
            <h2>Következő órák</h2>
            <Link to="/lessons">Összes</Link>
          </div>
          {d?.lessons.map((x: any) => (
            <article className="list-card" key={x.id}>
              <div>
                <strong>{x.title}</strong>
                <small>{x.scheduledDate || "Nincs dátum"}</small>
              </div>
              <Link to={`/lessons/${x.id}`}>Megnyitás</Link>
            </article>
          ))}
        </section>
        <section className="panel">
          <div className="section-head">
            <h2>Folyamatban</h2>
          </div>
          {d?.activeRuns.length ? (
            d.activeRuns.map((r: any) => (
              <article className="list-card" key={r.id}>
                <div>
                  <strong>
                    {r.state === "paused" ? "Szüneteltetett óra" : "Aktív óra"}
                  </strong>
                  <small>{r.lessonId}</small>
                </div>
                <Link to={`/presentation/${r.lessonId}`}>Folytatás</Link>
              </article>
            ))
          ) : (
            <p className="muted">Nincs aktív órafuttatás.</p>
          )}
          <div className="section-head">
            <h2>Jelzések</h2>
          </div>
          {d?.findings.map((f: any) => (
            <article className="list-card" key={f.id}>
              <strong>{f.title}</strong>
              <span className="chip">{f.severity || "jelzés"}</span>
            </article>
          ))}
        </section>
        <section className="panel span-two">
          <div className="section-head">
            <h2>Kiosztott feladatok</h2>
            <Link to="/assignments">Kezelés</Link>
          </div>
          <div className="card-row">
            {d?.assignments.map((a: any) => (
              <article className="metric-card" key={a.id}>
                <span className="eyebrow">{a.status}</span>
                <strong>{a.title}</strong>
                <small>Határidő: {a.deadlineDate || "nincs"}</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
