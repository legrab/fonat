import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ApiError, api, patch, post } from "../api";
import { EditorSaveStatus } from "../components/ConnectionStatus";
import { useUnsavedChanges } from "../components/UnsavedChangesGuard";

type NamedEntity = { id: string; title: string; type?: string };
type BlueprintSlot = {
  id: string;
  conceptId: string;
  points: number;
  difficultyMin?: number;
  difficultyMax?: number;
};
type Blueprint = NamedEntity & {
  courseId?: string;
  instructionsMarkdown?: string;
  slots?: BlueprintSlot[];
  status?: string;
  concurrencyVersion?: number;
};
type Delivery = NamedEntity & {
  learnerId: string;
  variant: string;
  status: string;
  score?: { percent: number; automaticPercent?: number };
};
type Preview = {
  totalPoints: number;
  slots: Array<
    BlueprintSlot & {
      eligibleCount: number;
      shortfall: boolean;
      candidateTitles: string[];
    }
  >;
};

export function AssessmentsPage() {
  const queryClient = useQueryClient();
  const blueprints = useQuery({
    queryKey: ["blueprints"],
    queryFn: () => api<Blueprint[]>("/api/assessment-blueprints?limit=100"),
  });
  const deliveries = useQuery({
    queryKey: ["deliveries"],
    queryFn: () => api<Delivery[]>("/api/assessment-deliveries?limit=100"),
  });
  const courses = useQuery({
    queryKey: ["courses", "assessment-selector"],
    queryFn: () => api<NamedEntity[]>("/api/courses?limit=100"),
  });
  const concepts = useQuery({
    queryKey: ["concepts", "assessment-selector"],
    queryFn: () => api<NamedEntity[]>("/api/nodes?limit=100"),
    select: (items) => items.filter((item) => item.type === "concept"),
  });
  const learners = useQuery({
    queryKey: ["learners", "assessment-selector"],
    queryFn: () => api<NamedEntity[]>("/api/learners?limit=100"),
  });
  const [editingId, setEditingId] = useState<string>();
  const [title, setTitle] = useState("Új felmérési terv");
  const [courseId, setCourseId] = useState("");
  const [instructionsMarkdown, setInstructionsMarkdown] = useState("");
  const [slots, setSlots] = useState<BlueprintSlot[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState("");
  const [learnerIds, setLearnerIds] = useState<string[]>([]);
  const [seed, setSeed] = useState("fonat-2026");
  const [preview, setPreview] = useState<Preview>();
  const [manualPercent, setManualPercent] = useState<Record<string, string>>(
    {},
  );
  const [overrideReason, setOverrideReason] = useState<Record<string, string>>(
    {},
  );
  const [dirty, setDirty] = useState(false);
  const unsaved = useUnsavedChanges(dirty);
  useEffect(() => {
    if (!courseId && courses.data?.[0]) setCourseId(courses.data[0].id);
    if (!selectedBlueprintId && blueprints.data?.[0])
      setSelectedBlueprintId(blueprints.data[0].id);
  }, [courseId, selectedBlueprintId, courses.data, blueprints.data]);
  const edit = (blueprint: Blueprint) => {
    setDirty(false);
    setEditingId(blueprint.id);
    setTitle(blueprint.title);
    setCourseId(blueprint.courseId || "");
    setInstructionsMarkdown(blueprint.instructionsMarkdown || "");
    setSlots(blueprint.slots || []);
  };
  const reset = () => {
    setDirty(false);
    setEditingId(undefined);
    setTitle("Új felmérési terv");
    setInstructionsMarkdown("");
    setSlots([]);
  };
  const saveBlueprint = useMutation({
    mutationFn: (status: string) => {
      const body = {
        title,
        courseId,
        instructionsMarkdown,
        slots,
        status,
        concurrencyVersion: blueprints.data?.find(
          (item) => item.id === editingId,
        )?.concurrencyVersion,
      };
      return editingId
        ? patch<Blueprint>(`/api/assessment-blueprints/${editingId}`, body)
        : post<Blueprint>("/api/assessment-blueprints", body);
    },
    onSuccess: async (blueprint) => {
      reset();
      setSelectedBlueprintId(blueprint.id);
      await queryClient.invalidateQueries({ queryKey: ["blueprints"] });
    },
  });
  const previewGeneration = useMutation({
    mutationFn: () =>
      post<Preview>("/api/assessments/preview", {
        blueprintId: selectedBlueprintId,
      }),
    onSuccess: setPreview,
  });
  const generate = useMutation({
    mutationFn: () =>
      post("/api/assessments/generate", {
        blueprintId: selectedBlueprintId,
        seed,
        learnerIds,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    },
  });
  const grade = useMutation({
    mutationFn: (delivery: Delivery) => {
      const value = manualPercent[delivery.id];
      return post(`/api/assessment-deliveries/${delivery.id}/grade`, {
        ...(value === "" || value == null
          ? {}
          : { manualPercent: Number(value) }),
        overrideReason: overrideReason[delivery.id],
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      await queryClient.invalidateQueries({ queryKey: ["findings"] });
      await queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
  });
  const hasShortfall = preview?.slots.some((slot) => slot.shortfall);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Stabil A/B kézbesítés</span>
          <h1>Felmérések</h1>
        </div>
        <div className="row-actions">
          <Link className="button secondary" to="/guide/create-an-assessment">
            Súgó
          </Link>
          <button className="secondary" onClick={() => window.print()}>
            Nyomtatási nézet
          </button>
        </div>
      </div>
      <div className="dashboard-grid assessment-workspace">
        <section
          className="panel stack"
          onChangeCapture={() => setDirty(true)}
          onClickCapture={() => setDirty(true)}
        >
          <div className="section-head">
            <h2>{editingId ? "Sablon szerkesztése" : "Új felmérési sablon"}</h2>
            {editingId && (
              <button
                className="ghost"
                onClick={() => unsaved.requestDiscard(reset)}
              >
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
            Tanulói útmutató (Markdown)
            <textarea
              rows={3}
              value={instructionsMarkdown}
              onChange={(event) => setInstructionsMarkdown(event.target.value)}
            />
          </label>
          <div className="section-head">
            <h3>Követelményhelyek</h3>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setSlots((current) => [
                  ...current,
                  {
                    id: crypto.randomUUID(),
                    conceptId: concepts.data?.[0]?.id || "",
                    points: 1,
                  },
                ])
              }
            >
              Hely hozzáadása
            </button>
          </div>
          {slots.map((slot, index) => (
            <article className="slot-editor" key={slot.id}>
              <label>
                {index + 1}. fogalom
                <select
                  value={slot.conceptId}
                  onChange={(event) =>
                    setSlots((current) =>
                      current.map((item) =>
                        item.id === slot.id
                          ? { ...item, conceptId: event.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="">Válassz fogalmat</option>
                  {concepts.data?.map((concept) => (
                    <option key={concept.id} value={concept.id}>
                      {concept.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pont
                <input
                  type="number"
                  min="1"
                  value={slot.points}
                  onChange={(event) =>
                    setSlots((current) =>
                      current.map((item) =>
                        item.id === slot.id
                          ? { ...item, points: Number(event.target.value) }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              <button
                className="ghost danger"
                onClick={() =>
                  setSlots((current) =>
                    current.filter((item) => item.id !== slot.id),
                  )
                }
              >
                Törlés
              </button>
            </article>
          ))}
          <strong>
            Összpontszám:{" "}
            {slots.reduce((total, slot) => total + slot.points, 0)}
          </strong>
          <EditorSaveStatus
            dirty={dirty}
            pending={saveBlueprint.isPending}
            saved={saveBlueprint.isSuccess}
          />
          {saveBlueprint.error && (
            <div className="error" role="alert">
              {saveBlueprint.error.message}
            </div>
          )}
          <div className="row-actions">
            <button
              className="secondary"
              disabled={
                saveBlueprint.isPending ||
                !title.trim() ||
                !courseId ||
                !slots.length
              }
              onClick={() => saveBlueprint.mutate("draft")}
            >
              Piszkozat mentése
            </button>
            <button
              disabled={
                saveBlueprint.isPending ||
                !title.trim() ||
                !courseId ||
                !slots.length ||
                slots.some((slot) => !slot.conceptId)
              }
              onClick={() => saveBlueprint.mutate("published")}
            >
              Közzététel
            </button>
          </div>
          <h3>Meglévő sablonok</h3>
          {blueprints.data?.map((blueprint) => (
            <article className="list-card" key={blueprint.id}>
              <div>
                <strong>{blueprint.title}</strong>
                <small>{blueprint.slots?.length || 0} követelményhely</small>
              </div>
              <button
                className="secondary"
                onClick={() => unsaved.requestDiscard(() => edit(blueprint))}
              >
                Szerkesztés
              </button>
            </article>
          ))}
        </section>
        <section className="panel stack">
          <h2>Változatok előkészítése</h2>
          <label>
            Közzétett sablon
            <select
              value={selectedBlueprintId}
              onChange={(event) => {
                setSelectedBlueprintId(event.target.value);
                setPreview(undefined);
              }}
            >
              <option value="">Válassz sablont</option>
              {blueprints.data?.map((blueprint) => (
                <option key={blueprint.id} value={blueprint.id}>
                  {blueprint.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tanulók
            <select
              multiple
              value={learnerIds}
              onChange={(event) =>
                setLearnerIds(
                  Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ),
                )
              }
            >
              {learners.data?.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.title}
                </option>
              ))}
            </select>
          </label>
          <details>
            <summary>Speciális beállítások</summary>
            <label>
              Reprodukálható mag
              <input
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
              />
            </label>
          </details>
          <button
            className="secondary"
            disabled={!selectedBlueprintId}
            onClick={() => previewGeneration.mutate()}
          >
            Jogosultság és hiány előnézete
          </button>
          {preview && (
            <div className="diagnostic">
              <strong>{preview.totalPoints} pont</strong>
              {preview.slots.map((slot, index) => (
                <p className={slot.shortfall ? "error" : ""} key={slot.id}>
                  {index + 1}. hely: {slot.eligibleCount} megfelelő feladat
                  {slot.shortfall
                    ? " — előbb adj hozzá vagy tágítsd a feltételeket"
                    : ""}
                </p>
              ))}
            </div>
          )}
          {(previewGeneration.error || generate.error) && (
            <div className="error" role="alert">
              {(previewGeneration.error || generate.error) instanceof ApiError
                ? (previewGeneration.error || generate.error)?.message
                : "A generálás sikertelen."}
            </div>
          )}
          <button
            disabled={
              !preview ||
              hasShortfall ||
              !learnerIds.length ||
              generate.isPending
            }
            onClick={() => generate.mutate()}
          >
            Stabil A/B kézbesítések létrehozása
          </button>
          <h2>Kézbesítések és értékelés</h2>
          {deliveries.data?.length ? (
            deliveries.data.map((delivery) => (
              <article className="submission-card stack" key={delivery.id}>
                <div className="section-head">
                  <div>
                    <strong>{delivery.title}</strong>
                    <small>
                      {learners.data?.find(
                        (learner) => learner.id === delivery.learnerId,
                      )?.title || "Ismeretlen tanuló"}{" "}
                      · {delivery.variant} változat · {delivery.status}
                    </small>
                  </div>
                  {delivery.score && (
                    <span className="grade">{delivery.score.percent}%</span>
                  )}
                </div>
                <div className="row-actions">
                  <Link
                    className="button secondary"
                    to={`/learner/assessment/${delivery.id}`}
                  >
                    Megnyitás
                  </Link>
                </div>
                {delivery.status === "submitted" && (
                  <>
                    <div className="two-cols">
                      <label>
                        Kézi százalék (opcionális)
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={manualPercent[delivery.id] || ""}
                          onChange={(event) =>
                            setManualPercent((current) => ({
                              ...current,
                              [delivery.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Felülbírálás indoka
                        <input
                          value={overrideReason[delivery.id] || ""}
                          onChange={(event) =>
                            setOverrideReason((current) => ({
                              ...current,
                              [delivery.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                    <button onClick={() => grade.mutate(delivery)}>
                      Értékelés rögzítése
                    </button>
                  </>
                )}
              </article>
            ))
          ) : (
            <p className="muted">Még nincs kézbesítés.</p>
          )}
          {grade.error && (
            <div className="error" role="alert">
              {grade.error.message}
            </div>
          )}
        </section>
      </div>
      {unsaved.confirmation}
    </>
  );
}
