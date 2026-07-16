import { useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api, patch, post } from "../api";

type NamedEntity = { id: string; title: string; type?: string };
type Phase = {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  conceptIds: string[];
};
type AnnualPlan = {
  id: string;
  title: string;
  courseId: string;
  schoolYear?: string;
  status?: string;
  phases?: Phase[];
  concurrencyVersion?: number;
};

export function AnnualPlanEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useQuery({
    queryKey: ["annual-plan", id],
    queryFn: () => api<AnnualPlan>(`/api/annual-plans/${id}`),
    enabled: Boolean(id),
  });
  const legacyPhases = useQuery({
    queryKey: ["phases", id],
    queryFn: () =>
      api<Array<Phase & { annualPlanId?: string }>>("/api/phases?limit=100"),
    select: (items) => items.filter((phase) => phase.annualPlanId === id),
    enabled: Boolean(id),
  });
  const courses = useQuery({
    queryKey: ["courses", "annual-plan-selector"],
    queryFn: () => api<NamedEntity[]>("/api/courses?limit=100"),
  });
  const concepts = useQuery({
    queryKey: ["concepts", "annual-plan-selector"],
    queryFn: () => api<NamedEntity[]>("/api/nodes?limit=100"),
    select: (items) => items.filter((item) => item.type === "concept"),
  });
  const [title, setTitle] = useState("Új éves terv");
  const [courseId, setCourseId] = useState("");
  const [schoolYear, setSchoolYear] = useState("2026/27");
  const [status, setStatus] = useState("draft");
  const [phases, setPhases] = useState<Phase[]>([]);
  useEffect(() => {
    if (!existing.data) return;
    setTitle(existing.data.title);
    setCourseId(existing.data.courseId || "");
    setSchoolYear(existing.data.schoolYear || "2026/27");
    setStatus(existing.data.status || "draft");
    setPhases(
      existing.data.phases?.length
        ? existing.data.phases
        : legacyPhases.data || [],
    );
  }, [existing.data, legacyPhases.data]);
  useEffect(() => {
    if (!id && !courseId && courses.data?.[0]) setCourseId(courses.data[0].id);
  }, [id, courseId, courses.data]);
  const updatePhase = (phaseId: string, changes: Partial<Phase>) =>
    setPhases((current) =>
      current.map((phase) =>
        phase.id === phaseId ? { ...phase, ...changes } : phase,
      ),
    );
  const save = useMutation({
    mutationFn: (nextStatus?: string) => {
      const body = {
        title,
        courseId,
        schoolYear,
        status: nextStatus || status,
        phases: phases.map((phase, order) => ({ ...phase, order: order + 1 })),
        concurrencyVersion: existing.data?.concurrencyVersion,
      };
      return id
        ? patch<AnnualPlan>(`/api/annual-plans/${id}`, body)
        : post<AnnualPlan>("/api/annual-plans", body);
    },
    onSuccess: (plan) => navigate(`/annual-plans/${plan.id || id}`),
  });
  if (id && existing.isLoading)
    return <div className="loading">Éves terv betöltése…</div>;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Éves tervezés</span>
          <h1>{id ? title : "Új éves terv"}</h1>
        </div>
        <div className="row-actions">
          <Link className="button secondary" to="/annual-plans">
            Mégse
          </Link>
          <button className="secondary" onClick={() => save.mutate("draft")}>
            Piszkozat mentése
          </button>
          <button
            disabled={!courseId || !phases.length}
            onClick={() => save.mutate("published")}
          >
            Közzététel
          </button>
        </div>
      </div>
      <div className="editor-grid">
        <section className="panel stack">
          <label>
            Terv címe
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            Kurzus
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="">Válassz kurzust</option>
              {courses.data?.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tanév
            <input
              value={schoolYear}
              onChange={(event) => setSchoolYear(event.target.value)}
            />
          </label>
          <div className="diagnostic">
            <strong>Lefedettség</strong>
            <p>
              {new Set(phases.flatMap((phase) => phase.conceptIds)).size}{" "}
              fogalom · {phases.length} tanulási szakasz
            </p>
          </div>
          {save.error && (
            <div className="error" role="alert">
              {save.error instanceof ApiError && save.error.code === "CONFLICT"
                ? "A tervet közben más módosította. Töltsd újra az oldalt."
                : `A mentés sikertelen: ${save.error.message}`}
            </div>
          )}
        </section>
        <section className="panel stack">
          <div className="section-head">
            <h2>Tanulási szakaszok</h2>
            <button
              type="button"
              onClick={() =>
                setPhases((current) => [
                  ...current,
                  {
                    id: crypto.randomUUID(),
                    title: `${current.length + 1}. szakasz`,
                    conceptIds: [],
                  },
                ])
              }
            >
              Szakasz hozzáadása
            </button>
          </div>
          {phases.map((phase, index) => (
            <article className="phase-editor stack" key={phase.id}>
              <div className="section-head">
                <strong>{index + 1}. szakasz</strong>
                <div className="row-actions">
                  <button
                    type="button"
                    className="ghost"
                    disabled={index === 0}
                    onClick={() =>
                      setPhases((current) =>
                        arrayMove(current, index, index - 1),
                      )
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    disabled={index === phases.length - 1}
                    onClick={() =>
                      setPhases((current) =>
                        arrayMove(current, index, index + 1),
                      )
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="ghost danger"
                    onClick={() =>
                      setPhases((current) =>
                        current.filter((item) => item.id !== phase.id),
                      )
                    }
                  >
                    Törlés
                  </button>
                </div>
              </div>
              <label>
                Megnevezés
                <input
                  value={phase.title}
                  onChange={(event) =>
                    updatePhase(phase.id, { title: event.target.value })
                  }
                />
              </label>
              <div className="two-cols">
                <label>
                  Kezdés
                  <input
                    type="date"
                    value={phase.startDate || ""}
                    onChange={(event) =>
                      updatePhase(phase.id, { startDate: event.target.value })
                    }
                  />
                </label>
                <label>
                  Befejezés
                  <input
                    type="date"
                    value={phase.endDate || ""}
                    onChange={(event) =>
                      updatePhase(phase.id, { endDate: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                Lefedett fogalmak
                <select
                  multiple
                  value={phase.conceptIds}
                  onChange={(event) =>
                    updatePhase(phase.id, {
                      conceptIds: Array.from(
                        event.currentTarget.selectedOptions,
                        (option) => option.value,
                      ),
                    })
                  }
                >
                  {concepts.data?.map((concept) => (
                    <option key={concept.id} value={concept.id}>
                      {concept.title}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))}
          {!phases.length && (
            <p className="muted">Adj hozzá legalább egy tanulási szakaszt.</p>
          )}
        </section>
      </div>
    </>
  );
}
