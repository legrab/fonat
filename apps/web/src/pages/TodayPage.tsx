import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useI18n } from "../i18n";

export function TodayPage() {
  const { t } = useI18n();
  const q = useQuery({
    queryKey: ["today"],
    queryFn: () => api<any>("/api/today"),
    refetchInterval: 5000,
  });
  const onboarding = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: () => api<any>("/api/onboarding/status"),
  });
  if (q.isLoading) return <div className="loading">{t("today.loading")}</div>;
  const d = q.data;
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">{d?.date}</span>
          <h1>{t("today.title")}</h1>
          <p>{t("today.body")}</p>
        </div>
        {onboarding.data?.complete ? (
          <Link className="button" to="/lessons/new">
            {t("today.newLesson")}
          </Link>
        ) : (
          <Link className="button" to="/setup">
            {t("today.finishSetup")}
          </Link>
        )}
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>{t("today.quickStart")}</h2>
          <Link to="/guide/getting-started">{t("today.gettingStarted")}</Link>
        </div>
        <div className="card-row">
          <Link className="metric-card" to="/library/new?type=concept">
            <span className="eyebrow">{t("today.content")}</span>
            <strong>{t("today.newConcept")}</strong>
            <small>{t("today.conceptHelp")}</small>
          </Link>
          <Link className="metric-card" to="/exercises/new">
            <span className="eyebrow">{t("today.practice")}</span>
            <strong>{t("today.newExercise")}</strong>
            <small>{t("today.exerciseHelp")}</small>
          </Link>
          <Link className="metric-card" to="/lessons/new">
            <span className="eyebrow">{t("today.planning")}</span>
            <strong>{t("today.newLesson")}</strong>
            <small>{t("today.lessonHelp")}</small>
          </Link>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-head">
            <h2>{t("today.nextLessons")}</h2>
            <Link to="/lessons">{t("today.all")}</Link>
          </div>
          {d?.lessons.map((x: any) => (
            <article className="list-card" key={x.id}>
              <div>
                <strong>{x.title}</strong>
                <small>{x.scheduledDate || t("today.noDate")}</small>
              </div>
              <Link to={`/lessons/${x.id}`}>{t("today.open")}</Link>
            </article>
          ))}
        </section>
        <section className="panel">
          <div className="section-head">
            <h2>{t("today.inProgress")}</h2>
          </div>
          {d?.activeRuns.length ? (
            d.activeRuns.map((r: any) => (
              <article className="list-card" key={r.id}>
                <div>
                  <strong>
                    {r.state === "paused"
                      ? t("today.pausedLesson")
                      : t("today.activeLesson")}
                  </strong>
                  <small>{r.lessonId}</small>
                </div>
                <Link to={`/presentation/${r.lessonId}`}>
                  {t("today.continue")}
                </Link>
              </article>
            ))
          ) : (
            <p className="muted">{t("today.noActiveRun")}</p>
          )}
          <div className="section-head">
            <h2>{t("today.findings")}</h2>
          </div>
          {d?.findings.map((f: any) => (
            <article className="list-card" key={f.id}>
              <strong>{f.title}</strong>
              <span className="chip">
                {f.severity || t("today.defaultFinding")}
              </span>
            </article>
          ))}
        </section>
        <section className="panel span-two">
          <div className="section-head">
            <h2>{t("today.assigned")}</h2>
            <Link to="/assignments">{t("today.manage")}</Link>
          </div>
          <div className="card-row">
            {d?.assignments.map((a: any) => (
              <article className="metric-card" key={a.id}>
                <span className="eyebrow">{a.status}</span>
                <strong>{a.title}</strong>
                <small>
                  {t("today.deadline", {
                    value: a.deadlineDate || t("today.none"),
                  })}
                </small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
