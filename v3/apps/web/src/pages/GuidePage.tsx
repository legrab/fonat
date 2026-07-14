import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
export function GuidePage() {
  const q = useQuery({
    queryKey: ["guide"],
    queryFn: () => api<any>("/api/guide"),
  });
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Beépített segítség</span>
          <h1>{q.data?.title || "Fonat Guide"}</h1>
        </div>
      </div>
      <div className="card-row">
        {q.data?.sections.map((s: any) => (
          <section className="panel guide-card" key={s.title}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>
    </>
  );
}
