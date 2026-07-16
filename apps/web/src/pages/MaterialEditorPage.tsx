import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ApiError, api, patch, post } from "../api";
import { ContentEditor } from "../components/ContentEditor";
import { Markdown } from "../components/Markdown";

type MaterialType = "concept" | "resource";
type Material = {
  id: string;
  title: string;
  type: MaterialType;
  summary?: string;
  markdown?: string;
  provider?: string;
  url?: string;
  lifecycle?: string;
  concurrencyVersion?: number;
};

export function MaterialEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const existing = useQuery({
    queryKey: ["node", id],
    queryFn: () => api<Material>(`/api/nodes/${id}`),
    enabled: Boolean(id),
  });
  const [hydrated, setHydrated] = useState(!id);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MaterialType>(
    searchParams.get("type") === "resource" ? "resource" : "concept",
  );
  const [summary, setSummary] = useState("");
  const [markdown, setMarkdown] = useState("Írd ide a tananyag tartalmát.");
  const [provider, setProvider] = useState("markdown");
  const [url, setUrl] = useState("");
  const [lifecycle, setLifecycle] = useState("draft");
  useEffect(() => {
    if (!existing.data) return;
    setTitle(existing.data.title);
    setType(existing.data.type || "concept");
    setSummary(existing.data.summary || "");
    setMarkdown(existing.data.markdown || "");
    setProvider(existing.data.provider || "markdown");
    setUrl(existing.data.url || "");
    setLifecycle(existing.data.lifecycle || "draft");
    setHydrated(true);
  }, [existing.data]);
  const save = useMutation({
    mutationFn: (nextLifecycle?: string) => {
      const body = {
        title,
        type,
        summary,
        markdown,
        provider: type === "resource" ? provider : undefined,
        url:
          type === "resource" && provider === "external-link" ? url : undefined,
        lifecycle: nextLifecycle || lifecycle,
        concurrencyVersion: existing.data?.concurrencyVersion,
      };
      return id ? patch(`/api/nodes/${id}`, body) : post("/api/nodes", body);
    },
    onSuccess: async (saved: unknown) => {
      await queryClient.invalidateQueries({ queryKey: ["nodes"] });
      const savedId = (saved as { id?: string }).id || id;
      navigate(`/library/${savedId}`);
    },
  });
  if (id && (existing.isLoading || !hydrated))
    return <div className="loading">Tananyag betöltése…</div>;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Tananyag-szerkesztő</span>
          <h1>{id ? "Tananyag módosítása" : "Új tananyag"}</h1>
        </div>
        <div className="row-actions">
          <Link className="button secondary" to="/guide/create-materials">
            Súgó
          </Link>
          <Link
            className="button secondary"
            to={id ? `/library/${id}` : "/library"}
          >
            Mégse
          </Link>
        </div>
      </div>
      <div className="editor-grid">
        <section className="panel stack">
          <label>
            Típus
            <select
              value={type}
              disabled={Boolean(id)}
              onChange={(event) => setType(event.target.value as MaterialType)}
            >
              <option value="concept">Fogalom</option>
              <option value="resource">Tananyagforrás</option>
            </select>
          </label>
          <label>
            Cím
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            Rövid összefoglaló
            <textarea
              rows={3}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>
          {type === "resource" && (
            <label>
              Forrás típusa
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
              >
                <option value="markdown">Belső Markdown tananyag</option>
                <option value="external-link">Külső hivatkozás</option>
              </select>
            </label>
          )}
          {type === "resource" && provider === "external-link" && (
            <label>
              Hivatkozás
              <input
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </label>
          )}
          <label>
            Tartalom
            <ContentEditor
              value={markdown}
              onChange={setMarkdown}
              ariaLabel="Tananyag tartalomszerkesztő"
            />
          </label>
          <label>
            Állapot
            <select
              value={lifecycle}
              onChange={(event) => setLifecycle(event.target.value)}
            >
              <option value="draft">Piszkozat</option>
              <option value="published">Közzétett</option>
              <option value="archived">Archivált</option>
            </select>
          </label>
          {save.error && (
            <div className="error" role="alert">
              {save.error instanceof ApiError && save.error.code === "CONFLICT"
                ? "A tananyagot közben más módosította. Töltsd újra az oldalt."
                : `A mentés sikertelen: ${save.error.message}`}
            </div>
          )}
          <div className="row-actions">
            <button
              className="secondary"
              disabled={!title.trim() || save.isPending}
              onClick={() => save.mutate("draft")}
            >
              Piszkozat mentése
            </button>
            <button
              disabled={
                !title.trim() || markdown.trim().length < 2 || save.isPending
              }
              onClick={() => save.mutate("published")}
            >
              Közzététel
            </button>
          </div>
        </section>
        <section className="panel preview">
          <span className="eyebrow">Előnézet</span>
          <h2>{title || "Névtelen tananyag"}</h2>
          {summary && <p className="muted">{summary}</p>}
          <Markdown>{markdown}</Markdown>
          {url && <a href={url}>Külső forrás megnyitása</a>}
        </section>
      </div>
    </>
  );
}
