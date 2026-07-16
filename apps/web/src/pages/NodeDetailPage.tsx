import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api, patch, post } from "../api";
import { Markdown } from "../components/Markdown";
export function NodeDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const node = useQuery({
    queryKey: ["node", id],
    queryFn: () => api<any>(`/api/nodes/${id}`),
  });
  const nodes = useQuery({
    queryKey: ["nodes"],
    queryFn: () => api<any[]>("/api/nodes?limit=100"),
  });
  const relations = useQuery({
    queryKey: ["relations"],
    queryFn: () => api<any[]>("/api/relations?limit=100"),
  });
  const [target, setTarget] = useState("");
  const [type, setType] = useState("requires");
  const add = useMutation({
    mutationFn: () =>
      post("/api/relations", {
        title: `${type}: ${id} → ${target}`,
        type,
        sourceId: id,
        targetId: target,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["relations"] }),
  });
  const archiveRelation = useMutation({
    mutationFn: (relation: any) =>
      patch(`/api/relations/${relation.id}`, {
        lifecycle: "archived",
        concurrencyVersion: relation.concurrencyVersion,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["relations"] }),
  });
  if (!node.data) return <p>Betöltés…</p>;
  const connected =
    relations.data?.filter((r) => r.sourceId === id || r.targetId === id) || [];
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">{node.data.type || "node"}</span>
          <h1>{node.data.title}</h1>
        </div>
        <Link className="button" to={`/library/${id}/edit`}>
          Szerkesztés
        </Link>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <Markdown>
            {node.data.markdown ||
              node.data.summary ||
              "Nincs hosszabb leírás."}
          </Markdown>
          {node.data.summary && <p className="muted">{node.data.summary}</p>}
        </section>
        <section className="panel">
          <h2>Kapcsolatok</h2>
          {connected
            .filter((r) => r.lifecycle !== "archived")
            .map((r) => (
              <article className="list-card" key={r.id}>
                <div>
                  <strong>{r.type}</strong>
                  <small>
                    {nodes.data?.find((n) => n.id === r.sourceId)?.title ||
                      "Ismeretlen elem"}{" "}
                    →{` `}
                    {nodes.data?.find((n) => n.id === r.targetId)?.title ||
                      "Ismeretlen elem"}
                  </small>
                </div>
                <button
                  className="ghost danger"
                  onClick={() => archiveRelation.mutate(r)}
                >
                  Eltávolítás
                </button>
              </article>
            ))}
          <div className="stack">
            <label>
              Típus
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="requires">előfeltétele</option>
                <option value="covers">lefed</option>
                <option value="alternative-to">alternatívája</option>
                <option value="extends">kiterjeszti</option>
              </select>
            </label>
            <label>
              Cél
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Válassz</option>
                {nodes.data
                  ?.filter((n) => n.id !== id)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
              </select>
            </label>
            <button disabled={!target} onClick={() => add.mutate()}>
              Kapcsolat hozzáadása
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
