import { useEffect, useMemo, useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api, patch, post } from "../api";
import { ContentEditor } from "../components/ContentEditor";
import { EditorSaveStatus } from "../components/ConnectionStatus";
import { Markdown } from "../components/Markdown";
import { useUnsavedChanges } from "../components/UnsavedChangesGuard";

type NamedEntity = { id: string; title: string; lifecycle?: string };
type Slide = {
  id: string;
  type: string;
  title: string;
  body?: string;
  exerciseId?: string;
  durationSeconds?: number;
  timerEndBehavior?: string;
  imageSvg?: string;
};
type Lesson = {
  id: string;
  title: string;
  courseId: string;
  locationId?: string;
  scheduledDate?: string;
  durationMinutes?: number;
  teacherNotes?: string;
  status: string;
  slides: Slide[];
  concurrencyVersion?: number;
};

const slideTypes = [
  ["section-intro", "Szakaszbevezető"],
  ["concept", "Fogalom / tananyag"],
  ["visual", "Kép vagy SVG"],
  ["task", "Gyakorlófeladat"],
  ["live-quiz", "Élő kérdés"],
  ["response-status", "Válaszállapot"],
  ["results", "Eredmények / rangsor"],
  ["solution", "Megoldás"],
  ["discussion", "Beszélgetésindító"],
  ["timer", "Időzítő"],
  ["homework", "Lezárás / házi feladat"],
] as const;

const typeLabel = (type: string) =>
  slideTypes.find(([value]) => value === type)?.[1] || type;

function SortableSlide({
  slide,
  selected,
  onSelect,
  onRemove,
  onMove,
}: {
  slide: Slide;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}) {
  const sortable = useSortable({ id: slide.id });
  return (
    <article
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`slide-row ${selected ? "selected" : ""}`}
    >
      <button
        type="button"
        className="drag"
        {...sortable.attributes}
        {...sortable.listeners}
        aria-label={`${slide.title} átrendezése`}
      >
        ⋮⋮
      </button>
      <button type="button" className="slide-summary" onClick={onSelect}>
        <strong>{slide.title}</strong>
        <small>
          {typeLabel(slide.type)} ·{" "}
          {slide.body?.slice(0, 90) || "Nincs tartalom"}
        </small>
      </button>
      <div className="row-actions">
        <button
          type="button"
          className="ghost"
          onClick={() => onMove(-1)}
          aria-label={`${slide.title} mozgatása felfelé`}
        >
          ↑
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => onMove(1)}
          aria-label={`${slide.title} mozgatása lefelé`}
        >
          ↓
        </button>
        <button type="button" className="danger ghost" onClick={onRemove}>
          Törlés
        </button>
      </div>
    </article>
  );
}

export function LessonEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => api<Lesson>(`/api/lessons/${id}`),
    enabled: Boolean(id),
  });
  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: () => api<NamedEntity[]>("/api/courses?limit=100"),
  });
  const locations = useQuery({
    queryKey: ["locations", "lesson-selector"],
    queryFn: () => api<NamedEntity[]>("/api/locations?limit=100"),
  });
  const exercises = useQuery({
    queryKey: ["exercises", "lesson-selector"],
    queryFn: () => api<NamedEntity[]>("/api/exercises?limit=100"),
    select: (items) => items.filter((item) => item.lifecycle === "published"),
  });
  const [title, setTitle] = useState("Új tanóra");
  const [courseId, setCourseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [teacherNotes, setTeacherNotes] = useState("");
  const [status, setStatus] = useState("draft");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const unsaved = useUnsavedChanges(dirty);
  useEffect(() => {
    if (!existing.data) return;
    setTitle(existing.data.title);
    setCourseId(existing.data.courseId);
    setLocationId(existing.data.locationId || "");
    setScheduledDate(existing.data.scheduledDate || "");
    setDurationMinutes(existing.data.durationMinutes || 45);
    setTeacherNotes(existing.data.teacherNotes || "");
    setStatus(existing.data.status);
    setSlides(existing.data.slides || []);
  }, [existing.data]);
  useEffect(() => {
    if (!id && !courseId && courses.data?.[0]) setCourseId(courses.data[0].id);
  }, [id, courseId, courses.data]);
  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId);
  const updateSelected = (changes: Partial<Slide>) => {
    setDirty(true);
    setSlides((current) =>
      current.map((slide) =>
        slide.id === selectedSlideId ? { ...slide, ...changes } : slide,
      ),
    );
  };
  const add = (type: string) => {
    const slide: Slide = {
      id: crypto.randomUUID(),
      type,
      title: typeLabel(type),
      body: "",
      ...(type === "timer"
        ? { durationSeconds: 60, timerEndBehavior: "advance" }
        : {}),
    };
    setDirty(true);
    setSlides((current) => [...current, slide]);
    setSelectedSlideId(slide.id);
  };
  const diagnostics = useMemo(() => {
    const errors: string[] = [];
    const suggestions: string[] = [];
    if (!courseId) errors.push("Válassz kurzust.");
    if (!slides.length) errors.push("Az óra még nem tartalmaz tevékenységet.");
    slides.forEach((slide, index) => {
      if (!slide.title.trim())
        errors.push(`${index + 1}. elem: hiányzik a cím.`);
      if (
        (slide.type === "task" || slide.type === "live-quiz") &&
        !slide.exerciseId
      )
        errors.push(`${index + 1}. elem: válassz gyakorlófeladatot.`);
      if (slide.type === "timer" && Number(slide.durationSeconds) < 1)
        errors.push(`${index + 1}. elem: az időzítő hossza érvénytelen.`);
      if (
        !slide.body?.trim() &&
        !["response-status", "results"].includes(slide.type)
      )
        suggestions.push(`${index + 1}. elemhez adj tartalmat.`);
    });
    if (!slides.some((slide) => slide.type === "live-quiz"))
      suggestions.push("Érdemes élő ellenőrzést hozzáadni.");
    if (!slides.some((slide) => slide.type === "homework"))
      suggestions.push("Az órának még nincs egyértelmű lezárása.");
    return { errors, suggestions };
  }, [courseId, slides]);
  const save = useMutation({
    mutationFn: (nextStatus?: string) => {
      const body = {
        title,
        courseId,
        locationId: locationId || undefined,
        scheduledDate: scheduledDate || undefined,
        durationMinutes,
        teacherNotes,
        status: nextStatus || status,
        slides,
        concurrencyVersion: existing.data?.concurrencyVersion,
      };
      return id
        ? patch<Lesson>(`/api/lessons/${id}`, body)
        : post<Lesson>("/api/lessons", body);
    },
    onSuccess: (lesson) => {
      setDirty(false);
      unsaved.allowNavigation();
      navigate(`/lessons/${lesson.id || id}`);
    },
  });
  const move = (index: number, delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= slides.length) return;
    setDirty(true);
    setSlides(arrayMove(slides, index, next));
  };
  const drag = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const from = slides.findIndex((slide) => slide.id === event.active.id);
    const to = slides.findIndex((slide) => slide.id === event.over!.id);
    setDirty(true);
    setSlides(arrayMove(slides, from, to));
  };
  if (id && existing.isLoading)
    return <div className="loading">Óraterv betöltése…</div>;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Óratervező</span>
          <h1>{id ? title : "Új óra"}</h1>
        </div>
        <div className="row-actions">
          <Link className="button secondary" to="/guide/build-a-lesson">
            Súgó
          </Link>
          {id && (
            <Link className="button secondary" to={`/presentation/${id}`}>
              Bemutatás
            </Link>
          )}
          <button
            className="secondary"
            onClick={() => save.mutate("draft")}
            disabled={save.isPending}
          >
            Piszkozat mentése
          </button>
          <button
            onClick={() => save.mutate("published")}
            disabled={save.isPending || diagnostics.errors.length > 0}
          >
            Közzététel
          </button>
        </div>
      </div>
      <div
        className="editor-grid lesson-editor-grid"
        onChangeCapture={() => setDirty(true)}
      >
        <section className="panel stack">
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
          <div className="two-cols">
            <label>
              Dátum
              <input
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
            </label>
            <label>
              Tervezett idő (perc)
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(Number(event.target.value))
                }
              />
            </label>
          </div>
          <label>
            Helyszín felülírása
            <select
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              <option value="">A kurzus alapértelmezése</option>
              {locations.data?.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tanári jegyzet (nem kerül a kivetített nézetbe)
            <textarea
              rows={4}
              value={teacherNotes}
              onChange={(event) => setTeacherNotes(event.target.value)}
            />
          </label>
          <div>
            <span className="eyebrow">Tevékenység hozzáadása</span>
            <div className="button-grid">
              {slideTypes.map(([value, label]) => (
                <button
                  type="button"
                  className="secondary"
                  key={value}
                  onClick={() => add(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`diagnostic ${diagnostics.errors.length ? "error" : ""}`}
          >
            <strong>Diagnosztika</strong>
            {diagnostics.errors.map((message) => (
              <p key={message}>• {message}</p>
            ))}
            {diagnostics.suggestions.map((message) => (
              <p className="muted" key={message}>
                • {message}
              </p>
            ))}
            {!diagnostics.errors.length && !diagnostics.suggestions.length && (
              <p>Az óraterv közzétehető.</p>
            )}
          </div>
          <EditorSaveStatus
            dirty={dirty}
            pending={save.isPending}
            saved={save.isSuccess}
          />
          {save.error && (
            <div className="error" role="alert">
              {save.error instanceof ApiError && save.error.code === "CONFLICT"
                ? "Az óratervet közben más módosította. Töltsd újra az oldalt."
                : `A mentés sikertelen: ${save.error.message}`}
            </div>
          )}
        </section>
        <section className="panel stack">
          <div className="section-head">
            <h2>Órafolyam</h2>
            <span>{slides.length} elem</span>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={drag}>
            <SortableContext
              items={slides.map((slide) => slide.id)}
              strategy={verticalListSortingStrategy}
            >
              {slides.map((slide, index) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  selected={slide.id === selectedSlideId}
                  onSelect={() => setSelectedSlideId(slide.id)}
                  onRemove={() => {
                    setDirty(true);
                    setSlides((current) =>
                      current.filter((item) => item.id !== slide.id),
                    );
                    if (selectedSlideId === slide.id)
                      setSelectedSlideId(undefined);
                  }}
                  onMove={(delta) => move(index, delta)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {!slides.length && (
            <p className="muted">
              Adj hozzá tananyagot, feladatot vagy lezárást.
            </p>
          )}
          {selectedSlide && (
            <div className="slide-editor stack">
              <div className="section-head">
                <h2>Kijelölt elem szerkesztése</h2>
                <span className="chip">{typeLabel(selectedSlide.type)}</span>
              </div>
              <label>
                Cím
                <input
                  value={selectedSlide.title}
                  onChange={(event) =>
                    updateSelected({ title: event.target.value })
                  }
                />
              </label>
              {(selectedSlide.type === "task" ||
                selectedSlide.type === "live-quiz") && (
                <label>
                  Gyakorlófeladat
                  <select
                    value={selectedSlide.exerciseId || ""}
                    onChange={(event) =>
                      updateSelected({
                        exerciseId: event.target.value || undefined,
                      })
                    }
                  >
                    <option value="">Válassz közzétett feladatot</option>
                    {exercises.data?.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {selectedSlide.type === "timer" && (
                <div className="two-cols">
                  <label>
                    Idő (másodperc)
                    <input
                      type="number"
                      min="1"
                      value={selectedSlide.durationSeconds || 60}
                      onChange={(event) =>
                        updateSelected({
                          durationSeconds: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Lejáratkor
                    <select
                      value={selectedSlide.timerEndBehavior || "advance"}
                      onChange={(event) =>
                        updateSelected({ timerEndBehavior: event.target.value })
                      }
                    >
                      <option value="stay">Marad</option>
                      <option value="reveal-next">Következő felfedése</option>
                      <option value="advance">Továbblépés</option>
                    </select>
                  </label>
                </div>
              )}
              {selectedSlide.type === "visual" && (
                <label>
                  Hozzáférhető SVG (opcionális)
                  <textarea
                    rows={5}
                    value={selectedSlide.imageSvg || ""}
                    onChange={(event) =>
                      updateSelected({ imageSvg: event.target.value })
                    }
                  />
                </label>
              )}
              <label>
                Megjelenő tartalom
                <ContentEditor
                  value={selectedSlide.body || ""}
                  onChange={(body) => updateSelected({ body })}
                  ariaLabel={`${selectedSlide.title} tartalomszerkesztő`}
                />
              </label>
              <div className="answer-preview">
                <Markdown>{selectedSlide.body}</Markdown>
              </div>
            </div>
          )}
        </section>
      </div>
      {unsaved.confirmation}
    </>
  );
}
