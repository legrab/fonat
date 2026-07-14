import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api, patch, post } from "../api";
import { Markdown } from "../components/Markdown";
export function PresentationPage() {
  const { lessonId } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const started = useRef(false);
  const [runtime, setRuntime] = useState<any>();
  const lesson = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => api<any>(`/api/lessons/${lessonId}`),
    enabled: Boolean(lessonId),
  });
  useEffect(() => {
    if (!lessonId || started.current) return;
    started.current = true;
    post<any>("/api/lesson-runs/start", { lessonId })
      .then(setRuntime)
      .catch(console.error);
  }, [lessonId]);
  const live = useQuery({
    queryKey: ["live-public", runtime?.live?.id],
    queryFn: () => api<any>(`/api/live/public/${runtime.live.id}`),
    enabled: Boolean(runtime?.live?.id),
    refetchInterval: 2000,
  });
  const results = useQuery({
    queryKey: ["live-results", runtime?.live?.id],
    queryFn: () => api<any>(`/api/live/${runtime.live.id}/results`),
    enabled: Boolean(runtime?.live?.id),
    refetchInterval: 2000,
  });
  const index = runtime?.run?.currentSlideIndex ?? 0;
  const slide = lesson.data?.slides?.[index];
  const change = async (next: number) => {
    const run = await patch<any>(`/api/lesson-runs/${runtime.run.id}/slide`, {
      index: next,
    });
    setRuntime((r: any) => ({ ...r, run }));
    qc.invalidateQueries({ queryKey: ["live-public"] });
  };
  const transition = async (to: string) => {
    await patch(`/api/lesson-runs/${runtime.run.id}/transition`, { to });
    if (to === "paused") nav("/");
    else if (to === "completed") nav("/?completed=1");
  };
  const reveal = async () => {
    await post(`/api/live/${runtime.live.id}/reveal`, { reveal: true });
    qc.invalidateQueries({ queryKey: ["live-public"] });
  };
  useEffect(() => {
    if (
      slide?.type === "timer" &&
      slide.timerEndBehavior === "advance" &&
      index < lesson.data.slides.length - 1
    ) {
      const timer = setTimeout(
        () => void change(index + 1),
        Math.max(1000, (slide.durationSeconds || 10) * 1000),
      );
      return () => clearTimeout(timer);
    }
  }, [slide?.id, index]);
  if (!lesson.data || !runtime)
    return <div className="presentation-loading">Bemutató előkészítése…</div>;
  return (
    <div className="presentation-controller">
      <header>
        <div>
          <span className="eyebrow">Tanári vezérlő</span>
          <h1>{lesson.data.title}</h1>
        </div>
        <div className="row-actions">
          <button className="secondary" onClick={() => transition("paused")}>
            Szünet és kilépés
          </button>
          <button onClick={() => transition("completed")}>
            Óra befejezése
          </button>
        </div>
      </header>
      <div className="controller-grid">
        <section className="projected-card">
          <span className="eyebrow">
            Kivetített dia {index + 1}/{lesson.data.slides.length}
          </span>
          <h2>{slide.title}</h2>
          {slide.imageSvg ? (
            <div
              className="svg-visual"
              dangerouslySetInnerHTML={{ __html: slide.imageSvg }}
            />
          ) : (
            <Markdown>{slide.body}</Markdown>
          )}
          {slide.type === "live-quiz" && (
            <div className="join-box">
              <QRCodeSVG
                value={`${location.origin}/join?code=${runtime.live.code}`}
                size={150}
              />
              <div>
                <span>Csatlakozási kód</span>
                <strong>{runtime.live.code}</strong>
                <small>
                  {results.data?.responseCount || 0}/
                  {results.data?.participantCount || 0} válasz
                </small>
              </div>
            </div>
          )}
          {slide.type === "response-status" && (
            <ResponseRows rows={results.data?.rows || []} />
          )}{" "}
          {slide.type === "results" && (
            <>
              <button onClick={reveal}>Megoldás és rangsor felfedése</button>
              {live.data?.results && <Leaderboard data={live.data.results} />}
            </>
          )}
        </section>
        <aside className="controller-panel">
          <div>
            <span className="eyebrow">Következő</span>
            <strong>
              {lesson.data.slides[index + 1]?.title || "Az óra vége"}
            </strong>
          </div>
          <div className="metric">
            <span>Válaszok</span>
            <strong>{results.data?.responseCount || 0}</strong>
          </div>
          <div className="metric">
            <span>Kapcsolódva</span>
            <strong>{results.data?.participantCount || 0}</strong>
          </div>
          <label>
            Gyors jegyzet
            <textarea rows={5} placeholder="Mi történt az órán?" />
          </label>
          <a
            className="button secondary"
            href={`/project/${runtime.live.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Kivetített ablak megnyitása
          </a>
          <div className="row-actions">
            <button
              disabled={index === 0}
              className="secondary"
              onClick={() => change(index - 1)}
            >
              Előző
            </button>
            <button
              disabled={index >= lesson.data.slides.length - 1}
              onClick={() => change(index + 1)}
            >
              Következő
            </button>
          </div>
          <Link to="/" className="text-link">
            Biztonságos visszatérés a munkatérbe
          </Link>
        </aside>
      </div>
    </div>
  );
}
function ResponseRows({ rows }: { rows: any[] }) {
  return (
    <div className="response-list">
      {rows.length === 0 ? (
        <p>Még senki sem csatlakozott.</p>
      ) : (
        rows.map((r) => (
          <div key={r.participantId}>
            <span>
              {r.badge} {r.nickname}
            </span>
            <strong>
              {r.status === "answered" ? "Válaszolt" : "Várakozik"}
            </strong>
          </div>
        ))
      )}
    </div>
  );
}
function Leaderboard({ data }: { data: any }) {
  return (
    <div>
      <div className="result-bar">
        <strong>{data.correct}</strong> helyes ·{" "}
        <strong>{data.incorrect}</strong> hibás
      </div>
      <div className="leaderboard">
        {data.leaderboard.map((r: any) => (
          <div key={r.participantId}>
            <span>
              #{r.rank} {r.badge} {r.nickname}
            </span>
            <strong>{r.correct ? "Helyes" : "Beküldve"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
