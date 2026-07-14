import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, patch, post } from "../api";
export function AssignmentsPage() {
  const qc = useQueryClient();
  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api<any[]>("/api/assignments"),
  });
  const submissions = useQuery({
    queryKey: ["submissions"],
    queryFn: () => api<any[]>("/api/submissions"),
  });
  const [title, setTitle] = useState("Új gyakorló feladat");
  const create = useMutation({
    mutationFn: () =>
      post("/api/assignments", {
        title,
        courseId: "course.grade8-math",
        status: "assigned",
        exerciseIds: ["exercise.missing-hypotenuse-6-8"],
        deadlineDate: "2026-09-25",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assignments"] }),
  });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      patch(`/api/submissions/${id}/review`, {
        decision,
        feedback:
          decision === "return"
            ? "Kérlek, írd le az ellenőrző lépést is."
            : "Elfogadva.",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["submissions"] }),
  });
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Kiosztás és javítás</span>
          <h1>Feladatok</h1>
        </div>
        <Link className="button secondary" to="/learner/assignments">
          Tanulói nézet
        </Link>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Új kiosztás</h2>
          <div className="inline-form">
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
            <button onClick={() => create.mutate()}>Kiosztás</button>
          </div>
          <h2>Aktív feladatok</h2>
          {assignments.data?.map((a) => (
            <article className="list-card" key={a.id}>
              <div>
                <strong>{a.title}</strong>
                <small>
                  {a.deadlineDate} · {a.status}
                </small>
              </div>
              <span className="chip">{a.exerciseIds?.length || 0} feladat</span>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>Beadások</h2>
          {submissions.data?.length ? (
            submissions.data.map((s) => (
              <article className="submission-card" key={s.id}>
                <div>
                  <strong>{s.title}</strong>
                  <small>
                    {s.learnerId} · {s.status} · {s.attemptNumber}. próbálkozás
                  </small>
                </div>
                <pre>{JSON.stringify(s.answers, null, 2)}</pre>
                {s.status !== "accepted" && (
                  <div className="row-actions">
                    <button
                      className="secondary"
                      onClick={() =>
                        review.mutate({ id: s.id, decision: "return" })
                      }
                    >
                      Visszaküldés
                    </button>
                    <button
                      onClick={() =>
                        review.mutate({ id: s.id, decision: "accept" })
                      }
                    >
                      Elfogadás
                    </button>
                  </div>
                )}
              </article>
            ))
          ) : (
            <p className="muted">Még nincs beadás.</p>
          )}
        </section>
      </div>
    </>
  );
}
