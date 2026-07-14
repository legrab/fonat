import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api, post } from "../api";
import { Logo } from "../components/Logo";
import { Markdown } from "../components/Markdown";
export function JoinPage() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [nickname, setNickname] = useState("");
  const [join, setJoin] = useState<any>();
  const [answer, setAnswer] = useState<any>("");
  const [ack, setAck] = useState("");
  const session = useQuery({
    queryKey: ["learner-session", join?.sessionId],
    queryFn: () => api<any>(`/api/live/public/${join.sessionId}`),
    enabled: Boolean(join),
    refetchInterval: 2000,
  });
  const joinMut = useMutation({
    mutationFn: () => post<any>("/api/live/join", { code, nickname }),
    onSuccess: setJoin,
  });
  const submit = useMutation({
    mutationFn: () =>
      post<any>("/api/live/answer", {
        participantToken: join.participantToken,
        answer,
      }),
    onSuccess: (r) =>
      setAck(
        r.status === "already-accepted"
          ? "A válaszod már beérkezett."
          : "A válaszodat elfogadtuk.",
      ),
  });
  if (!join)
    return (
      <div className="learner-page">
        <div className="learner-card">
          <Logo />
          <h1>Csatlakozás az órához</h1>
          <label>
            Hatjegyű kód
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <label>
            Becenév
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Például: Bagoly"
            />
          </label>
          <button
            disabled={code.length < 4 || joinMut.isPending}
            onClick={() => joinMut.mutate()}
          >
            Csatlakozás
          </button>
          {joinMut.error && <div className="error">A kód nem található.</div>}
        </div>
      </div>
    );
  const d = session.data;
  const ex = d?.exercise;
  return (
    <div className="learner-page">
      <div className="learner-card wide">
        <span className="eyebrow">{d?.lesson.title}</span>
        <h1>{d?.slide?.title}</h1>
        <Markdown>{d?.slide?.body}</Markdown>
        {ex && (
          <div className="answer-box">
            {(ex.exerciseType === "single-choice" ||
              ex.exerciseType === "multiple-choice") &&
              ex.options?.map((o: any) => (
                <label key={o.id}>
                  <input
                    name="choice"
                    type={
                      ex.exerciseType === "single-choice" ? "radio" : "checkbox"
                    }
                    onChange={(e) => {
                      if (ex.exerciseType === "single-choice") setAnswer(o.id);
                      else
                        setAnswer((v: any[]) =>
                          e.target.checked
                            ? [...(Array.isArray(v) ? v : []), o.id]
                            : (Array.isArray(v) ? v : []).filter(
                                (x) => x !== o.id,
                              ),
                        );
                    }}
                  />{" "}
                  {o.text}
                </label>
              ))}
            {ex.exerciseType === "boolean" && (
              <select
                value={answer}
                onChange={(e) => setAnswer(e.target.value === "true")}
              >
                <option value="">Válassz</option>
                <option value="true">Igaz</option>
                <option value="false">Hamis</option>
              </select>
            )}
            {(ex.exerciseType === "numeric" ||
              ex.exerciseType === "accepted-text" ||
              ex.exerciseType === "manual-response") && (
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Válaszod"
              />
            )}
            <button
              disabled={submit.isPending || Boolean(ack)}
              onClick={() => submit.mutate()}
            >
              Válasz beküldése
            </button>
            {ack && <div className="success">{ack}</div>}
          </div>
        )}
        {!ex && (
          <p className="muted">
            A tanár még nem nyitott meg válaszolható kérdést.
          </p>
        )}
      </div>
    </div>
  );
}
