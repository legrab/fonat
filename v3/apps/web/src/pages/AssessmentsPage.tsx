import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, post } from "../api";
export function AssessmentsPage() {
  const qc = useQueryClient();
  const blueprints = useQuery({
    queryKey: ["blueprints"],
    queryFn: () => api<any[]>("/api/assessment-blueprints"),
  });
  const deliveries = useQuery({
    queryKey: ["deliveries"],
    queryFn: () => api<any[]>("/api/assessment-deliveries"),
  });
  const generate = useMutation({
    mutationFn: (id: string) =>
      post<any>("/api/assessments/generate", {
        blueprintId: id,
        seed: "fonat-2026",
        learnerIds: ["learner.red-panda", "learner.hedgehog"],
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }),
  });
  const grade = useMutation({
    mutationFn: (id: string) =>
      post(`/api/assessment-deliveries/${id}/grade`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }),
  });
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Deterministic delivery</span>
          <h1>Felmérések</h1>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Sablonok</h2>
          {blueprints.data?.map((b) => (
            <article className="list-card" key={b.id}>
              <div>
                <strong>{b.title}</strong>
                <small>{b.slots?.length || 0} követelményhely</small>
              </div>
              <button onClick={() => generate.mutate(b.id)}>
                A/B generálás
              </button>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>Változatok és kézbesítések</h2>
          {deliveries.data?.length ? (
            deliveries.data.map((d) => (
              <article className="list-card" key={d.id}>
                <div>
                  <strong>{d.title}</strong>
                  <small>
                    {d.learnerId} · {d.status}{" "}
                    {d.score ? `· ${d.score.percent}%` : ""}
                  </small>
                </div>
                <div className="row-actions">
                  <Link
                    className="button secondary"
                    to={`/learner/assessment/${d.id}`}
                  >
                    Megnyitás
                  </Link>
                  {d.status === "submitted" && (
                    <button onClick={() => grade.mutate(d.id)}>
                      Értékelés
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="muted">Generálj kézbesítést egy sablonból.</p>
          )}
        </section>
      </div>
    </>
  );
}
