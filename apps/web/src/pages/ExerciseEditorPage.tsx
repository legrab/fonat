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
  normalization: z.enum(["trim-casefold", "exact"]).default("trim-casefold"),
  responseGuidance: z.string().optional(),
  rubricMarkdown: z.string().optional(),
  evidencePolicy: z.enum(["none", "light", "deep"]).default("light"),
  contributionLevel: z
    .enum(["introduces", "practices", "assesses"])
    .default("practices"),
});
type Form = z.infer<typeof schema>;
type ExerciseOption = { id: string; text: string };
export function ExerciseEditorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const existing = useQuery({
    queryKey: ["exercise", id],
    queryFn: () => api<any>(`/api/exercises/${id}`),
    enabled: Boolean(id),
  });
  const concepts = useQuery({
    queryKey: ["concepts", "exercise-selector"],
    queryFn: () => api<any[]>("/api/nodes?search=&limit=100"),
    select: (nodes) => nodes.filter((node) => node.type === "concept"),
  });
  const [prompt, setPrompt] = useState("Írd ide a feladat szövegét.");
  const [solution, setSolution] = useState("");
  const [hydrated, setHydrated] = useState(!id);
  const [options, setOptions] = useState<ExerciseOption[]>([
    { id: crypto.randomUUID(), text: "Első lehetőség" },
    { id: crypto.randomUUID(), text: "Második lehetőség" },
  ]);
  const [correctOptionIds, setCorrectOptionIds] = useState<string[]>([]);
  const [conceptIds, setConceptIds] = useState<string[]>([]);
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      exerciseType: "manual-response",
      expectedMinutes: 5,
      difficulty: 2,
      lifecycle: "draft",
      normalization: "trim-casefold",
      evidencePolicy: "light",
      contributionLevel: "practices",
    },
  });
  useEffect(() => {
    if (existing.data) {
      const e = existing.data;
      setPrompt(e.promptMarkdown || "");
      setSolution(e.solutionMarkdown || "");
      setOptions(
        e.options?.length
          ? e.options
          : [
              { id: crypto.randomUUID(), text: "Első lehetőség" },
              { id: crypto.randomUUID(), text: "Második lehetőség" },
            ],
      );
      setCorrectOptionIds(e.correctOptionIds || []);
      setConceptIds(e.conceptIds || []);
      form.reset({
        ...e,
        expectedValue: e.expectedValue,
        absoluteTolerance: e.absoluteTolerance,
        correctValue: String(e.correctValue ?? ""),
        acceptedVariants: (e.acceptedVariants || []).join("\n"),
        normalization: e.normalization || "trim-casefold",
        responseGuidance: e.responseGuidance || "",
        rubricMarkdown: e.rubricMarkdown || "",
        evidencePolicy: e.evidencePolicy || "light",
        contributionLevel: e.contributionLevel || "practices",
      });
      setHydrated(true);
    }
  }, [existing.data]);
  const selected = form.watch("exerciseType");
  const save = useMutation({
    mutationFn: async (v: Form) => {
      const body: any = {
        title: v.title,
        exerciseType: v.exerciseType,
        promptMarkdown: prompt,
        solutionMarkdown: solution,
        expectedMinutes: Number(v.expectedMinutes),
        difficulty: Number(v.difficulty),
        lifecycle: v.lifecycle,
        conceptIds,
        options:
          v.exerciseType === "single-choice" ||
          v.exerciseType === "multiple-choice"
            ? options.filter((option) => option.text.trim())
            : undefined,
        correctOptionIds:
          v.exerciseType === "single-choice" ||
          v.exerciseType === "multiple-choice"
            ? correctOptionIds
            : undefined,
        correctValue: v.correctValue === "true",
        expectedValue: v.expectedValue,
        absoluteTolerance: v.absoluteTolerance,
        acceptedUnit: v.acceptedUnit,
        acceptedVariants: (v.acceptedVariants || "")
          .split("\n")
          .filter(Boolean),
        normalization: v.normalization,
        responseGuidance: v.responseGuidance,
        rubricMarkdown: v.rubricMarkdown,
        evidencePolicy: v.evidencePolicy,
        contributionLevel: v.contributionLevel,
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
            <fieldset className="stack option-editor">
              <legend>Válaszlehetőségek és helyes válasz</legend>
              {options.map((option, index) => (
                <div className="option-row" key={option.id}>
                  <input
                    aria-label={`${index + 1}. lehetőség helyes`}
                    type={selected === "single-choice" ? "radio" : "checkbox"}
                    name="correct-option"
                    checked={correctOptionIds.includes(option.id)}
                    onChange={(event) =>
                      setCorrectOptionIds((current) =>
                        selected === "single-choice"
                          ? event.target.checked
                            ? [option.id]
                            : []
                          : event.target.checked
                            ? [...current, option.id]
                            : current.filter((value) => value !== option.id),
                      )
                    }
                  />
                  <input
                    aria-label={`${index + 1}. válaszlehetőség`}
                    value={option.text}
                    onChange={(event) =>
                      setOptions((current) =>
                        current.map((item) =>
                          item.id === option.id
                            ? { ...item, text: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="ghost danger"
                    disabled={options.length <= 2}
                    onClick={() => {
                      setOptions((current) =>
                        current.filter((item) => item.id !== option.id),
                      );
                      setCorrectOptionIds((current) =>
                        current.filter((value) => value !== option.id),
                      );
                    }}
                  >
                    Törlés
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setOptions((current) => [
                    ...current,
                    { id: crypto.randomUUID(), text: "" },
                  ])
                }
              >
                Válaszlehetőség hozzáadása
              </button>
            </fieldset>
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
            <>
              <label>
                Elfogadott változatok, soronként
                <textarea rows={4} {...form.register("acceptedVariants")} />
              </label>
              <label>
                Összehasonlítás
                <select {...form.register("normalization")}>
                  <option value="trim-casefold">
                    Szóköz- és kis/nagybetű-tűrő
                  </option>
                  <option value="exact">Pontos egyezés</option>
                </select>
              </label>
            </>
          )}
          {selected === "manual-response" && (
            <>
              <label>
                Válaszadási útmutató
                <textarea rows={3} {...form.register("responseGuidance")} />
              </label>
              <label>
                Rövid értékelési szempontok (Markdown)
                <textarea rows={4} {...form.register("rubricMarkdown")} />
              </label>
            </>
          )}
          <label>
            Kapcsolódó fogalmak
            <select
              multiple
              value={conceptIds}
              onChange={(event) =>
                setConceptIds(
                  Array.from(
                    event.currentTarget.selectedOptions,
                    (option) => option.value,
                  ),
                )
              }
            >
              {concepts.data?.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.title}
                </option>
              ))}
            </select>
          </label>
          <div className="two-cols">
            <label>
              Pedagógiai szerep
              <select {...form.register("contributionLevel")}>
                <option value="introduces">Bevezet</option>
                <option value="practices">Gyakoroltat</option>
                <option value="assesses">Ellenőriz</option>
              </select>
            </label>
            <label>
              Bizonyíték mélysége
              <select {...form.register("evidencePolicy")}>
                <option value="none">Nem gyűjt</option>
                <option value="light">Rövid</option>
                <option value="deep">Részletes</option>
              </select>
            </label>
          </div>
          <label>
            Mentési állapot
            <select {...form.register("lifecycle")}>
              <option value="draft">Piszkozat</option>
              <option value="published">Közzétett</option>
            </select>
          </label>
          <div className="row-actions">
            <button
              type="button"
              className="secondary"
              disabled={save.isPending}
              onClick={() => {
                form.setValue("lifecycle", "draft");
                void form.handleSubmit((value) => save.mutate(value as Form))();
              }}
            >
              Piszkozat mentése
            </button>
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => {
                form.setValue("lifecycle", "published");
                void form.handleSubmit((value) => save.mutate(value as Form))();
              }}
            >
              Közzététel
            </button>
          </div>
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
              options
                .filter((option) => option.text.trim())
                .map((option) => (
                  <label key={option.id}>
                    <input
                      type={selected === "single-choice" ? "radio" : "checkbox"}
                      disabled
                    />{" "}
                    {option.text}
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
