import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, post, put } from "../api";
import { Logo } from "../components/Logo";
export function LearnerAssignmentsPage() {
  const learnerId = "learner.hedgehog";
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["learner-assignments"],
    queryFn: () => api<any[]>(`/api/assignments/public?learnerId=${learnerId}`),
  });
  return (
    <div className="learner-page align-start">
      <div className="learner-card wide">
        <Logo />
        <h1>Sün feladatai</h1>
        {q.data?.map((a) => (
          <LearnerAssignment
            key={a.id}
            a={a}
            learnerId={learnerId}
            refresh={() =>
              qc.invalidateQueries({ queryKey: ["learner-assignments"] })
            }
          />
        ))}
      </div>
    </div>
  );
}
function LearnerAssignment({
  a,
  learnerId,
  refresh,
}: {
  a: any;
  learnerId: string;
  refresh: () => void;
}) {
  const [answer, setAnswer] = useState(a.draft?.answers?.response || "");
  const save = useMutation({
    mutationFn: () =>
      put(`/api/assignments/public/${a.id}/draft`, {
        learnerId,
        answers: { response: answer },
      }),
    onSuccess: refresh,
  });
  const submit = useMutation({
    mutationFn: () =>
      post(`/api/assignments/public/${a.id}/submit`, {
        learnerId,
        answers: { response: answer },
      }),
    onSuccess: refresh,
  });
  const latest = a.submissions?.at(-1);
  return (
    <section className="assignment-task">
      <span className="eyebrow">{a.deadlineDate}</span>
      <h2>{a.title}</h2>
      <textarea
        rows={4}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Írd le a megoldásod és az ellenőrzést."
      />
      <div className="row-actions">
        <button className="secondary" onClick={() => save.mutate()}>
          Piszkozat mentése
        </button>
        <button onClick={() => submit.mutate()}>Beadás</button>
      </div>
      {a.draft && <small>Piszkozat elmentve.</small>}
      {latest && (
        <div
          className={
            latest.status === "returned" ? "diagnostic warning" : "success"
          }
        >
          <strong>{latest.status}</strong>
          {latest.feedback && <p>{latest.feedback}</p>}
        </div>
      )}
    </section>
  );
}
