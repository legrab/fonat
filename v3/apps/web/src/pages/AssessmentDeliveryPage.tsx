import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api, post } from "../api";
import { Markdown } from "../components/Markdown";
export function AssessmentDeliveryPage() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["delivery", id],
    queryFn: () => api<any>(`/api/assessment-deliveries/public/${id}`),
  });
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const submit = useMutation({
    mutationFn: () =>
      post<any>(`/api/assessment-deliveries/public/${id}/submit`, { answers }),
    onSuccess: () => q.refetch(),
  });
  if (!q.data) return <div className="learner-page">Betöltés…</div>;
  return (
    <div className="learner-page align-start">
      <div className="learner-card wide">
        <span className="eyebrow">
          {q.data.variant} változat · {q.data.status}
        </span>
        <h1>{q.data.title}</h1>
        {q.data.exerciseSnapshots?.map((e: any, i: number) => (
          <section className="assessment-question" key={e.id}>
            <h2>{i + 1}. kérdés</h2>
            <Markdown>{e.promptMarkdown}</Markdown>
            {e.exerciseType === "single-choice" ||
            e.exerciseType === "multiple-choice" ? (
              e.options?.map((o: any) => (
                <label key={o.id}>
                  <input
                    name={e.id}
                    type={
                      e.exerciseType === "single-choice" ? "radio" : "checkbox"
                    }
                    onChange={(ev) =>
                      setAnswers((v) => ({
                        ...v,
                        [e.id]:
                          e.exerciseType === "single-choice"
                            ? o.id
                            : ev.target.checked
                              ? [...((v[e.id] as string[]) || []), o.id]
                              : ((v[e.id] as string[]) || []).filter(
                                  (x) => x !== o.id,
                                ),
                      }))
                    }
                  />{" "}
                  {o.text}
                </label>
              ))
            ) : (
              <input
                onChange={(ev) =>
                  setAnswers((v) => ({ ...v, [e.id]: ev.target.value }))
                }
              />
            )}
          </section>
        ))}
        <button
          disabled={
            q.data.status === "submitted" ||
            q.data.status === "graded" ||
            submit.isPending
          }
          onClick={() => submit.mutate()}
        >
          Felmérés beadása
        </button>
      </div>
    </div>
  );
}
