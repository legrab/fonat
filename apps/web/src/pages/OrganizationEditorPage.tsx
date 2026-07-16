import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api, patch, post } from "../api";

type OrganizationRoute =
  "courses" | "learner-groups" | "learners" | "locations";
type NamedEntity = { id: string; title: string };

const labels: Record<OrganizationRoute, { single: string; list: string }> = {
  courses: { single: "kurzus", list: "Kurzusok" },
  "learner-groups": { single: "tanulócsoport", list: "Tanulócsoportok" },
  learners: { single: "tanuló", list: "Tanulók" },
  locations: { single: "helyszín", list: "Helyszínek" },
};

export function OrganizationEditorPage({
  route,
}: {
  route: OrganizationRoute;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const existing = useQuery({
    queryKey: [route, id],
    queryFn: () => api<Record<string, unknown>>(`/api/${route}/${id}`),
    enabled: Boolean(id),
  });
  const subjects = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api<NamedEntity[]>("/api/subjects?limit=100"),
    enabled: route === "courses",
  });
  const groups = useQuery({
    queryKey: ["learner-groups", "selector"],
    queryFn: () => api<NamedEntity[]>("/api/learner-groups?limit=100"),
    enabled: route === "courses",
  });
  const locations = useQuery({
    queryKey: ["locations", "selector"],
    queryFn: () => api<NamedEntity[]>("/api/locations?limit=100"),
    enabled: route === "courses",
  });
  const [title, setTitle] = useState("");
  const [schoolYear, setSchoolYear] = useState("2026/27");
  const [displayPseudonym, setDisplayPseudonym] = useState("");
  const [note, setNote] = useState("");
  const [room, setRoom] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [locationId, setLocationId] = useState("");
  const [timezone, setTimezone] = useState("Europe/Budapest");
  const [status, setStatus] = useState("active");
  useEffect(() => {
    if (!existing.data) return;
    const entity = existing.data;
    setTitle(String(entity.title || entity.name || ""));
    setSchoolYear(String(entity.schoolYear || "2026/27"));
    setDisplayPseudonym(String(entity.displayPseudonym || entity.title || ""));
    setNote(String(entity.note || ""));
    setRoom(String(entity.room || ""));
    setSubjectId(String(entity.subjectId || ""));
    setGroupIds(
      Array.isArray(entity.learnerGroupIds)
        ? entity.learnerGroupIds.map(String)
        : [],
    );
    setLocationId(String(entity.defaultLocationId || ""));
    setTimezone(String(entity.timezone || "Europe/Budapest"));
    setStatus(String(entity.status || "active"));
  }, [existing.data]);
  useEffect(() => {
    if (route !== "courses" || id) return;
    if (!subjectId && subjects.data?.[0]) setSubjectId(subjects.data[0].id);
    if (!locationId && locations.data?.[0]) setLocationId(locations.data[0].id);
  }, [route, id, subjectId, locationId, subjects.data, locations.data]);
  const body = useMemo(() => {
    const common = { title, status };
    if (route === "learner-groups") return { ...common, schoolYear };
    if (route === "learners")
      return { ...common, displayPseudonym: displayPseudonym || title, note };
    if (route === "locations") return { ...common, room };
    return {
      ...common,
      subjectId,
      learnerGroupIds: groupIds,
      defaultLocationId: locationId,
      timezone,
    };
  }, [
    route,
    title,
    status,
    schoolYear,
    displayPseudonym,
    note,
    room,
    subjectId,
    groupIds,
    locationId,
    timezone,
  ]);
  const save = useMutation({
    mutationFn: () =>
      id
        ? patch(`/api/${route}/${id}`, {
            ...body,
            concurrencyVersion: existing.data?.concurrencyVersion,
          })
        : post(`/api/${route}`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [route] });
      navigate(`/${route}`);
    },
  });
  if (id && existing.isLoading) return <div className="loading">Betöltés…</div>;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Munkatér beállítása</span>
          <h1>
            {id
              ? `${labels[route].single} szerkesztése`
              : `Új ${labels[route].single}`}
          </h1>
        </div>
        <Link className="button secondary" to={`/${route}`}>
          Mégse
        </Link>
      </div>
      <form
        className="panel stack"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <label>
          Megnevezés
          <input
            required
            minLength={1}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        {route === "learner-groups" && (
          <label>
            Tanév
            <input
              value={schoolYear}
              onChange={(event) => setSchoolYear(event.target.value)}
            />
          </label>
        )}
        {route === "learners" && (
          <>
            <label>
              Megjelenített név vagy álnév
              <input
                value={displayPseudonym}
                onChange={(event) => setDisplayPseudonym(event.target.value)}
              />
            </label>
            <label>
              Tanári megjegyzés
              <textarea
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
          </>
        )}
        {route === "locations" && (
          <label>
            Terem vagy rövid helyleírás
            <input
              value={room}
              onChange={(event) => setRoom(event.target.value)}
            />
          </label>
        )}
        {route === "courses" && (
          <>
            <label>
              Tantárgy
              <select
                required
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
              >
                <option value="">Válassz tantárgyat</option>
                {subjects.data?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tanulócsoportok
              <select
                multiple
                value={groupIds}
                onChange={(event) =>
                  setGroupIds(
                    Array.from(
                      event.currentTarget.selectedOptions,
                      (option) => option.value,
                    ),
                  )
                }
              >
                {groups.data?.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title}
                  </option>
                ))}
              </select>
              <small className="muted">
                Több csoport kijelöléséhez használd a Ctrl/Cmd billentyűt.
              </small>
            </label>
            <div className="two-cols">
              <label>
                Alapértelmezett helyszín
                <select
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                >
                  <option value="">Nincs megadva</option>
                  {locations.data?.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Időzóna
                <input
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                />
              </label>
            </div>
          </>
        )}
        <label>
          Állapot
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="active">Aktív</option>
            <option value="archived">Archivált</option>
          </select>
        </label>
        {save.error && (
          <div className="error" role="alert">
            {save.error instanceof ApiError && save.error.code === "CONFLICT"
              ? "Az adatot közben más módosította. Töltsd újra az oldalt."
              : `A mentés sikertelen: ${save.error.message}`}
          </div>
        )}
        <button disabled={!title.trim() || save.isPending}>
          {save.isPending ? "Mentés…" : "Mentés"}
        </button>
      </form>
    </>
  );
}
