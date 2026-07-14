import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
export function ProjectsPage() {
  const q = useQuery({
    queryKey: ["projects"],
    queryFn: () => api<any[]>("/api/projects"),
    retry: false,
  });
  if (q.error)
    return (
      <section className="panel">
        <h1>A Projekt képesség ki van kapcsolva</h1>
        <p>Az adatok megmaradnak, a navigáció és az útvonalak nem elérhetők.</p>
      </section>
    );
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Elkülönített funkcionális alap</span>
          <h1>Projektek</h1>
        </div>
      </div>
      {q.data?.map((p) => (
        <section className="panel project-hero" key={p.id}>
          <div>
            <span className="chip">{p.status}</span>
            <h2>{p.title}</h2>
            <p>{p.summary}</p>
          </div>
          <div>
            <h3>Kihívások</h3>
            {p.challenges?.map((x: string) => (
              <p key={x}>◦ {x}</p>
            ))}
            <h3>Diák-hozzájárulási pontok</h3>
            {p.contributors?.map((x: string) => (
              <p key={x}>□ {x}</p>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
