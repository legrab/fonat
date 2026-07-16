import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, api, patch, post } from "../api";
import { ContentEditor } from "../components/ContentEditor";
import { Markdown } from "../components/Markdown";
const types = [
  ["manual-response", "Kifejtős / magyarázat"],
  ["single-choice", "Egyszeres választás"],
  ["multiple-choice", "Többszörös választás"],
  ["boolean", "Igaz / hamis"],
  ["numeric", "Számérték"],
  ["accepted-text", "Elfogadott szöveg"],
] as const;
const schema = z.object({
  title: z.string().min(2),
  exerciseType: z.enum(types.map((x) => x[0]) as [any, ...any[]]),
  expectedMinutes: z.coerce.number().min(1),
  difficulty: z.coerce.number().min(1).max(5),
  lifecycle: z.enum(["draft", "published"]),
  expectedValue: z.coerce.number().optional(),
  absoluteTolerance: z.coerce.number().min(0).optional(),
  acceptedUnit: z.string().optional(),
  correctValue: z.string().optional(),
  acceptedVariants: z.string().optional(),
  optionsText: z.string().optional(),
  correctOptionIds: z.string().optional(),
});
type Form = z.infer<typeof schema>;
export function ExerciseEditorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const existing = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => api<any>(`/api/exercises/${id}`),
    enabled: Boolean(id),
  });
  const [prompt, setPrompt] = useState("Írd ide a feladat szövegét.");
  const [solution, setSolution] = useState("");
  const [hydrated, setHydrated] = useState(!id);
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      exerciseType: "manual-response",
      expectedMinutes: 5,
      difficulty: 2,
      lifecycle: "draft",
      optionsText: "Első lehetőség\nMásodik lehetőség",
      correctOptionIds: "a",
    },
  });
  useEffect(() => {
    if (existing.data) {
      const e = existing.data;
      setPrompt(e.promptMarkdown || "");
      setSolution(e.solutionMarkdown || "");
      form.reset({
        ...e,
        expectedValue: e.expectedValue,
        absoluteTolerance: e.absoluteTolerance,
        correctValue: String(e.correctValue ?? ""),
        acceptedVariants: (e.acceptedVariants || []).join("\n"),
        optionsText: (e.options || []).map((o: any) => o.text).join("\n"),
        correctOptionIds: (e.correctOptionIds || []).join(","),
      });
      setHydrated(true);
    }
  }, [existing.data]);
  const selected = form.watch("exerciseType");
  const save = useMutation({
    mutationFn: async (v: Form) => {
      const options = (v.optionsText || "")
        .split("\n")
        .filter(Boolean)
        .map((text, i) => ({ id: String.fromCharCode(97 + i), text }));
      const body: any = {
        title: v.title,
        exerciseType: v.exerciseType,
        promptMarkdown: prompt,
        solutionMarkdown: solution,
        expectedMinutes: Number(v.expectedMinutes),
        difficulty: Number(v.difficulty),
        lifecycle: v.lifecycle,
        conceptIds: [],
        options,
        correctOptionIds: (v.correctOptionIds || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        correctValue: v.correctValue === "true",
        expectedValue: v.expectedValue,
        absoluteTolerance: v.absoluteTolerance,
        acceptedUnit: v.acceptedUnit,
        acceptedVariants: (v.acceptedVariants || "")
          .split("\n")
          .filter(Boolean),
        normalization: "trim-casefold",
        concurrencyVersion: existing.data?.concurrencyVersion,
      };
      return id
        ? patch(`/api/exercises/${id}`, body)
        : post("/api/exercises", body);
    },
    onSuccess: () => nav("/library"),
  });
  if (id && (existing.isLoading || !hydrated))
    return <div className="loading">Feladat betöltése…</div>;
  if (existing.error)
    return (
      <section className="panel error" role="alert">
        A feladat nem tölthető be: {existing.error.message}
      </section>
    );
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Vezetett szerkesztő</span>
          <h1>{id ? "Feladat módosítása" : "Új feladat"}</h1>
        </div>
        <button className="secondary" onClick={() => nav(-1)}>
          Mégse
        </button>
      </div>
      <form
        className="editor-grid"
        onSubmit={form.handleSubmit((v) => save.mutate(v as Form))}
      >
        <section className="panel stack">
          <label>
            Cím
            <input {...form.register("title")} />
          </label>
          <label>
            Típus
            <select {...form.register("exerciseType")}>
              {types.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <div className="two-cols">
            <label>
              Időtartam
              <input type="number" {...form.register("expectedMinutes")} />
            </label>
            <label>
              Nehézség
              <input
                type="number"
                min="1"
                max="5"
                {...form.register("difficulty")}
              />
            </label>
          </div>
          <label>
            Feladatszöveg
            <ContentEditor
              value={prompt}
              onChange={setPrompt}
              ariaLabel="Feladatszöveg szerkesztő"
            />
          </label>
          <label>
            Megoldás / magyarázat
            <ContentEditor
              value={solution}
              onChange={setSolution}
              ariaLabel="Megoldás szerkesztő"
            />
          </label>
          {(selected === "single-choice" || selected === "multiple-choice") && (
            <>
              <label>
                Válaszlehetőségek, soronként
                <textarea rows={5} {...form.register("optionsText")} />
              </label>
              <label>
                Helyes betűk, vesszővel
                <input {...form.register("correctOptionIds")} />
              </label>
            </>
          )}
          {selected === "boolean" && (
            <label>
              Helyes érték
              <select {...form.register("correctValue")}>
                <option value="true">Igaz</option>
                <option value="false">Hamis</option>
              </select>
            </label>
          )}
          {selected === "numeric" && (
            <div className="two-cols">
              <label>
                Várt érték
                <input
                  type="number"
                  step="any"
                  {...form.register("expectedValue")}
                />
              </label>
              <label>
                Tolerancia
                <input
                  type="number"
                  step="any"
                  {...form.register("absoluteTolerance")}
                />
              </label>
              <label>
                Mértékegység
                <input {...form.register("acceptedUnit")} />
              </label>
            </div>
          )}
          {selected === "accepted-text" && (
            <label>
              Elfogadott változatok, soronként
              <textarea rows={4} {...form.register("acceptedVariants")} />
            </label>
          )}
          <label>
            Mentési állapot
            <select {...form.register("lifecycle")}>
              <option value="draft">Piszkozat</option>
              <option value="published">Közzétett</option>
            </select>
          </label>
          <button disabled={save.isPending}>
            {save.isPending ? "Mentés…" : "Feladat mentése"}
          </button>
          {Object.keys(form.formState.errors).length > 0 && (
            <div className="error">Ellenőrizd a megjelölt mezőket.</div>
          )}
          {save.error && (
            <div className="error" role="alert">
              {save.error instanceof ApiError && save.error.code === "CONFLICT"
                ? "A feladatot közben más módosította. Töltsd újra az oldalt, majd ellenőrizd a változásokat."
                : `A mentés sikertelen: ${save.error.message}`}
            </div>
          )}
        </section>
        <section className="panel preview">
          <span className="eyebrow">Tanulói előnézet</span>
          <h2>{form.watch("title") || "Névtelen feladat"}</h2>
          <Markdown>{prompt}</Markdown>
          <div className="answer-preview">
            {selected === "manual-response" && (
              <textarea placeholder="Tanulói válasz" rows={5} />
            )}{" "}
            {(selected === "single-choice" || selected === "multiple-choice") &&
              (form.watch("optionsText") || "")
                .split("\n")
                .filter(Boolean)
                .map((x: string, i: number) => (
                  <label key={i}>
                    <input
                      type={selected === "single-choice" ? "radio" : "checkbox"}
                      disabled
                    />{" "}
                    {x}
                  </label>
                ))}{" "}
            {selected === "boolean" && (
              <div>
                <button type="button" className="secondary">
                  Igaz
                </button>{" "}
                <button type="button" className="secondary">
                  Hamis
                </button>
              </div>
            )}{" "}
            {selected === "numeric" && <input placeholder="Számérték" />}{" "}
            {selected === "accepted-text" && (
              <input placeholder="Rövid válasz" />
            )}
          </div>
        </section>
      </form>
    </>
  );
}
