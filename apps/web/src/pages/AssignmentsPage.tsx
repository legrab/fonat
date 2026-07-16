import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ApiError, api, patch, post } from "../api";
import { Markdown } from "../components/Markdown";

type NamedEntity = { id: string; title: string; lifecycle?: string };
type Assignment = NamedEntity & {
  courseId?: string;
  instructionsMarkdown?: string;
  exerciseIds?: string[];
  deadlineDate?: string;
  attemptLimit?: number;
  feedbackRelease?: string;
  evidencePolicy?: string;
  status?: string;
  concurrencyVersion?: number;
};
type Submission = NamedEntity & {
  assignmentId: string;
  learnerId: string;
  attemptNumber: number;
  answers: Record<string, unknown>;
  status: string;
  feedback?: string;
};

export function AssignmentsPage() {
  const queryClient = useQueryClient();
  const assignments = useQuery({
    queryKey: ["assignments"],
    queryFn: () => api<Assignment[]>("/api/assignments?limit=100"),
  });
  const submissions = useQuery({
    queryKey: ["submissions"],
    queryFn: () => api<Submission[]>("/api/submissions"),
  });
  const courses = useQuery({
    queryKey: ["courses", "assignment-selector"],
    queryFn: () => api<NamedEntity[]>("/api/courses?limit=100"),
  });
  const exercises = useQuery({
    queryKey: ["exercises", "assignment-selector"],
    queryFn: () => api<NamedEntity[]>("/api/exercises?limit=100"),
    select: (items) => items.filter((item) => item.lifecycle === "published"),
  });
  const learners = useQuery({
    queryKey: ["learners", "review-selector"],
    queryFn: () => api<NamedEntity[]>("/api/learners?limit=100"),
  });
  const [editingId, setEditingId] = useState<string>();
  const [title, setTitle] = useState("Új gyakorló kiosztás");
  const [instructionsMarkdown, setInstructionsMarkdown] = useState("");
  const [courseId, setCourseId] = useState("");
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [attemptLimit, setAttemptLimit] = useState(3);
  const [feedbackRelease, setFeedbackRelease] = useState("after-review");
  const [evidencePolicy, setEvidencePolicy] = useState("light");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!courseId && courses.data?.[0]) setCourseId(courses.data[0].id);
  }, [courseId, courses.data]);
  const resetForm = () => {
    setEditingId(undefined);
    setTitle("Új gyakorló kiosztás");
    setInstructionsMarkdown("");
    setExerciseIds([]);
    setDeadlineDate("");
    setAttemptLimit(3);
    setFeedbackRelease("after-review");
    setEvidencePolicy("light");
  };
  const edit = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setTitle(assignment.title);
    setInstructionsMarkdown(assignment.instructionsMarkdown || "");
    setCourseId(assignment.courseId || "");
    setExerciseIds(assignment.exerciseIds || []);
    setDeadlineDate(assignment.deadlineDate || "");
    setAttemptLimit(assignment.attemptLimit || 3);
    setFeedbackRelease(assignment.feedbackRelease || "after-review");
    setEvidencePolicy(assignment.evidencePolicy || "light");
  };
  const save = useMutation({
    mutationFn: (status: string) => {
      const body = {
        title,
        instructionsMarkdown,
        courseId,
        exerciseIds,
        deadlineDate: deadlineDate || undefined,
        attemptLimit,
        feedbackRelease,
        evidencePolicy,
        status,
        concurrencyVersion: assignments.data?.find(
          (item) => item.id === editingId,
        )?.concurrencyVersion,
      };
      return editingId
        ? patch(`/api/assignments/${editingId}`, body)
        : post("/api/assignments", body);
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      patch(`/api/submissions/${id}/review`, {
        decision,
        feedback:
          feedback[id] ||
          (decision === "accept"
            ? "Elfogadva."
            : "Kérlek, javítsd a jelzett részt."),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["submissions"] }),
  });
  const attemptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    submissions.data?.forEach((submission) => {
      const key = `${submission.assignmentId}:${submission.learnerId}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [submissions.data]);
  const canSave = title.trim() && courseId && exerciseIds.length > 0;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Kiosztás és javítás</span>
          <h1>Kiosztások</h1>
        </div>
        <div className="row-actions">
          <Link className="button secondary" to="/guide/assign-and-review">
            Súgó
          </Link>
          <Link className="button secondary" to="/learner/assignments">
            Tanulói nézet
          </Link>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel stack">
          <div className="section-head">
            <h2>{editingId ? "Kiosztás szerkesztése" : "Új kiosztás"}</h2>
            {editingId && (
              <button className="ghost" onClick={resetForm}>
                Mégse
              </button>
            )}
          </div>
          <label>
            Cím
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            Tanulói útmutató (Markdown)
            <textarea
              rows={4}
              value={instructionsMarkdown}
              onChange={(event) => setInstructionsMarkdown(event.target.value)}
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
            Gyakorlófeladatok
            <select
              multiple
              value={exerciseIds}
              onChange={(event) =>
                setExerciseIds(
                  Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ),
                )
              }
            >
              {exercises.data?.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.title}
                </option>
              ))}
            </select>
          </label>
          <div className="two-cols">
            <label>
              Határidő
              <input
                type="date"
                value={deadlineDate}
                onChange={(event) => setDeadlineDate(event.target.value)}
              />
            </label>
            <label>
              Próbálkozások száma
              <input
                type="number"
                min="1"
                value={attemptLimit}
                onChange={(event) =>
                  setAttemptLimit(Number(event.target.value))
                }
              />
            </label>
          </div>
          <div className="two-cols">
            <label>
              Visszajelzés kiadása
              <select
                value={feedbackRelease}
                onChange={(event) => setFeedbackRelease(event.target.value)}
              >
                <option value="after-review">Tanári ellenőrzés után</option>
                <option value="after-submit">Beadás után</option>
              </select>
            </label>
            <label>
              Bizonyíték
              <select
                value={evidencePolicy}
                onChange={(event) => setEvidencePolicy(event.target.value)}
              >
                <option value="none">Nem gyűjt</option>
                <option value="light">Rövid</option>
                <option value="deep">Részletes</option>
              </select>
            </label>
          </div>
          {save.error && (
            <div className="error" role="alert">
              {save.error instanceof ApiError
                ? save.error.message
                : "A mentés sikertelen."}
            </div>
          )}
          <div className="row-actions">
            <button
              className="secondary"
              disabled={!canSave || save.isPending}
              onClick={() => save.mutate("draft")}
            >
              Piszkozat mentése
            </button>
            <button
              disabled={!canSave || save.isPending}
              onClick={() => save.mutate("assigned")}
            >
              Kiosztás
            </button>
          </div>
          <h2>Meglévő kiosztások</h2>
          {assignments.data?.map((assignment) => (
            <article className="list-card" key={assignment.id}>
              <div>
                <strong>{assignment.title}</strong>
                <small>
                  {courses.data?.find(
                    (course) => course.id === assignment.courseId,
                  )?.title || "Nincs kurzus"}{" "}
                  · {assignment.deadlineDate || "nincs határidő"} ·{" "}
                  {assignment.status}
                </small>
              </div>
              <button className="secondary" onClick={() => edit(assignment)}>
                Szerkesztés
              </button>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>Beadások ellenőrzése</h2>
          {submissions.data?.length ? (
            submissions.data.map((submission) => (
              <article className="submission-card stack" key={submission.id}>
                <div className="section-head">
                  <div>
                    <strong>
                      {assignments.data?.find(
                        (assignment) =>
                          assignment.id === submission.assignmentId,
                      )?.title || submission.title}
                    </strong>
                    <small>
                      {learners.data?.find(
                        (learner) => learner.id === submission.learnerId,
                      )?.title || "Ismeretlen tanuló"}{" "}
                      · {submission.attemptNumber}. próbálkozás ·{" "}
                      {submission.status}
                    </small>
                  </div>
                  <span className="chip">
                    {attemptCounts.get(
                      `${submission.assignmentId}:${submission.learnerId}`,
                    ) || 1}{" "}
                    kísérlet
                  </span>
                </div>
                <div className="answer-box">
                  {Object.entries(submission.answers).map(([key, value]) => (
                    <div key={key}>
                      <strong>{key}</strong>
                      <Markdown>{String(value)}</Markdown>
                    </div>
                  ))}
                </div>
                {submission.status !== "accepted" && (
                  <>
                    <label>
                      Tanári visszajelzés
                      <textarea
                        rows={3}
                        value={
                          feedback[submission.id] ?? submission.feedback ?? ""
                        }
                        onChange={(event) =>
                          setFeedback((current) => ({
                            ...current,
                            [submission.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="row-actions">
                      <button
                        className="secondary"
                        onClick={() =>
                          review.mutate({
                            id: submission.id,
                            decision: "return",
                          })
                        }
                      >
                        Visszaküldés
                      </button>
                      <button
                        onClick={() =>
                          review.mutate({
                            id: submission.id,
                            decision: "accept",
                          })
                        }
                      >
                        Elfogadás
                      </button>
                    </div>
                  </>
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
