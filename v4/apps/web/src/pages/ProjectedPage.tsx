import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { Markdown } from "../components/Markdown";
export function ProjectedPage() {
  const { sessionId } = useParams();
  const q = useQuery({
    queryKey: ["projection", sessionId],
    queryFn: () => api<any>(`/api/live/public/${sessionId}`),
    refetchInterval: 1500,
  });
  if (q.isLoading)
    return (
      <div className="projection">
        <h1>Kapcsolódás…</h1>
      </div>
    );
  const d = q.data;
  if (d?.session.status === "completed")
    return (
      <div className="projection">
        <h1>Az óra befejeződött.</h1>
        <p>Köszönjük a közös munkát.</p>
      </div>
    );
  return (
    <div className="projection">
      <span className="eyebrow">{d?.lesson.title}</span>
      <h1>{d?.slide?.title}</h1>
      {d?.slide?.imageSvg ? (
        <div
          className="svg-visual"
          dangerouslySetInnerHTML={{ __html: d.slide.imageSvg }}
        />
      ) : (
        <Markdown>{d?.slide?.body}</Markdown>
      )}
      {d?.slide?.type === "live-quiz" && (
        <div className="projection-code">
          <strong>{d.session.code}</strong>
          <span>
            {d.responseCount}/{d.participantCount} válasz
          </span>
        </div>
      )}
      {d?.results && (
        <div className="projection-results">
          <h2>{d.results.correct} helyes válasz</h2>
          {d.results.leaderboard.map((r: any) => (
            <p key={r.participantId}>
              #{r.rank} {r.badge} {r.nickname}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
