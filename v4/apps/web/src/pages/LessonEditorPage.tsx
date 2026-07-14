import { useEffect, useState } from "react";
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
import { api, patch, post } from "../api";
type Slide = {
  id: string;
  type: string;
  title: string;
  body?: string;
  exerciseId?: string;
  durationSeconds?: number;
  timerEndBehavior?: string;
};
function SortableSlide({
  slide,
  onRemove,
  onMove,
}: {
  slide: Slide;
  onRemove: () => void;
  onMove: (delta: number) => void;
}) {
  const s = useSortable({ id: slide.id });
  return (
    <article
      ref={s.setNodeRef}
      style={{
        transform: CSS.Transform.toString(s.transform),
        transition: s.transition,
      }}
      className="slide-row"
    >
      <button
        type="button"
        className="drag"
        {...s.attributes}
        {...s.listeners}
        aria-label="Átrendezés"
      >
        ⋮⋮
      </button>
      <div>
        <strong>{slide.title}</strong>
        <small>
          {slide.type} · {slide.body?.slice(0, 90)}
        </small>
      </div>
      <div className="row-actions">
        <button type="button" className="ghost" onClick={() => onMove(-1)}>
          ↑
        </button>
        <button type="button" className="ghost" onClick={() => onMove(1)}>
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
  const nav = useNavigate();
  const existing = useQuery({
    queryKey: ["lesson", id],
    queryFn: () => api<any>(`/api/lessons/${id}`),
    enabled: Boolean(id),
  });
  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: () => api<any[]>("/api/courses"),
  });
  const exercises = useQuery({
    queryKey: ["exercises"],
    queryFn: () => api<any[]>("/api/exercises?limit=100"),
  });
  const [title, setTitle] = useState("Új tanóra");
  const [courseId, setCourseId] = useState("course.grade8-math");
  const [status, setStatus] = useState("draft");
  const [slides, setSlides] = useState<Slide[]>([]);
  useEffect(() => {
    if (existing.data) {
      setTitle(existing.data.title);
      setCourseId(existing.data.courseId);
      setStatus(existing.data.status);
      setSlides(existing.data.slides || []);
    }
  }, [existing.data]);
  const add = (type: string) => {
    const ex = exercises.data?.[0];
    setSlides((v) => [
      ...v,
      {
        id: crypto.randomUUID(),
        type,
        title:
          {
            concept: "Fogalom",
            task: "Feladat",
            "live-quiz": "Élő kvíz",
            solution: "Megoldás",
            homework: "Házi feladat",
            timer: "Időzített lezárás",
          }[type] || "Dia",
        body: "Szerkeszthető tartalom",
        ...(type === "live-quiz" || type === "task"
          ? { exerciseId: ex?.id }
          : {}),
        ...(type === "timer"
          ? { durationSeconds: 30, timerEndBehavior: "advance" }
          : {}),
      },
    ]);
  };
  const save = useMutation({
    mutationFn: () =>
      id
        ? patch(`/api/lessons/${id}`, {
            title,
            courseId,
            status,
            slides,
            concurrencyVersion: existing.data?.concurrencyVersion,
          })
        : post("/api/lessons", { title, courseId, status, slides }),
    onSuccess: (x: any) => nav(`/lessons/${x.id || id}`),
  });
  const move = (index: number, delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= slides.length) return;
    setSlides(arrayMove(slides, index, next));
  };
  const drag = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) {
      const from = slides.findIndex((x) => x.id === e.active.id),
        to = slides.findIndex((x) => x.id === e.over!.id);
      setSlides(arrayMove(slides, from, to));
    }
  };
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Óratervező</span>
          <h1>{id ? title : "Új óra"}</h1>
        </div>
        <div className="row-actions">
          {id && (
            <Link className="button secondary" to={`/presentation/${id}`}>
              Bemutatás
            </Link>
          )}
          <button onClick={() => save.mutate()}>
            {save.isPending ? "Mentés…" : "Mentés"}
          </button>
        </div>
      </div>
      <div className="editor-grid">
        <section className="panel stack">
          <label>
            Cím
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Kurzus
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {courses.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Állapot
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">Piszkozat</option>
              <option value="published">Közzétett</option>
            </select>
          </label>
          <div>
            <span className="eyebrow">Dia hozzáadása</span>
            <div className="button-grid">
              {[
                "concept",
                "task",
                "live-quiz",
                "solution",
                "timer",
                "homework",
              ].map((x) => (
                <button
                  type="button"
                  className="secondary"
                  key={x}
                  onClick={() => add(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div className="diagnostic warning">
            <strong>Diagnosztika</strong>
            <p>
              {slides.length === 0
                ? "Az óra még nem tartalmaz diákat."
                : slides.some((x) => x.type === "live-quiz")
                  ? "Élő kvíz és kilépési útvonal rendelkezésre áll."
                  : "Élő ellenőrzés még nincs az órában."}
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="section-head">
            <h2>Diafolyam</h2>
            <span>{slides.length} dia</span>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={drag}>
            <SortableContext
              items={slides.map((x) => x.id)}
              strategy={verticalListSortingStrategy}
            >
              {slides.map((s, i) => (
                <SortableSlide
                  key={s.id}
                  slide={s}
                  onRemove={() =>
                    setSlides((v) => v.filter((x) => x.id !== s.id))
                  }
                  onMove={(d) => move(i, d)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {slides.length === 0 && (
            <p className="muted">Adj hozzá fogalmat, feladatot vagy kvízt.</p>
          )}
        </section>
      </div>
    </>
  );
}
