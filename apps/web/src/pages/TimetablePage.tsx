import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
export function TimetablePage() {
  const q = useQuery({
    queryKey: ["timetable"],
    queryFn: () => api<any[]>("/api/timetable"),
  });
  const byDate = (q.data || []).reduce<Record<string, any[]>>((acc, x: any) => {
    (acc[x.date] ||= []).push(x);
    return acc;
  }, {});
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Heti nézet</span>
          <h1>Órarend</h1>
        </div>
      </div>
      {Object.entries(byDate).map(([date, items]) => (
        <section className="panel" key={date}>
          <h2>{date}</h2>
          {items?.map((x: any) => (
            <article
              className={`timeline-item ${x.overlap ? "warning" : ""}`}
              key={x.id}
            >
              <time>
                {x.start}–{x.end}
              </time>
              <div>
                <strong>{x.title}</strong>
                <small>
                  {x.courseId} · {x.locationId}
                </small>
              </div>
              {x.overlap && <span className="chip warning">Átfedés</span>}
            </article>
          ))}
        </section>
      ))}
    </>
  );
}
