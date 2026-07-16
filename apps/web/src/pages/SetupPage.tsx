import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, post } from "../api";

export function SetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [subjectTitle, setSubjectTitle] = useState("Matematika");
  const [groupTitle, setGroupTitle] = useState("");
  const [schoolYear, setSchoolYear] = useState("2026/27");
  const [learnerText, setLearnerText] = useState("");
  const [locationTitle, setLocationTitle] = useState("");
  const [room, setRoom] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const setup = useMutation({
    mutationFn: () =>
      post<{ course: { id: string } }>("/api/onboarding/complete", {
        subjectTitle,
        groupTitle,
        schoolYear,
        learnerNames: learnerText
          .split("\n")
          .map((name) => name.trim())
          .filter(Boolean),
        locationTitle,
        room: room || undefined,
        courseTitle,
        timezone: "Europe/Budapest",
      }),
    onSuccess: async ({ course }) => {
      await queryClient.invalidateQueries();
      navigate(`/courses/${course.id}`);
    },
  });
  const canSubmit =
    subjectTitle.trim().length > 1 &&
    groupTitle.trim().length > 0 &&
    learnerText.trim().length > 0 &&
    locationTitle.trim().length > 1 &&
    courseTitle.trim().length > 1;
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Első munkatér</span>
          <h1>Állítsd össze az első kurzusodat</h1>
          <p className="muted">
            A Fonat egy kurzus köré kapcsolja a csoportot, a tanulókat, a
            helyszínt és a későbbi óraterveket.
          </p>
        </div>
        <Link className="button secondary" to="/guide/getting-started">
          Súgó
        </Link>
      </div>
      <form
        className="editor-grid"
        onSubmit={(event) => {
          event.preventDefault();
          setup.mutate();
        }}
      >
        <section className="panel stack">
          <h2>1. Tantárgy és csoport</h2>
          <label>
            Tantárgy
            <input
              value={subjectTitle}
              onChange={(event) => setSubjectTitle(event.target.value)}
            />
          </label>
          <div className="two-cols">
            <label>
              Tanulócsoport
              <input
                placeholder="például 8. a"
                value={groupTitle}
                onChange={(event) => setGroupTitle(event.target.value)}
              />
            </label>
            <label>
              Tanév
              <input
                value={schoolYear}
                onChange={(event) => setSchoolYear(event.target.value)}
              />
            </label>
          </div>
          <label>
            Tanulók, soronként egy név
            <textarea
              rows={7}
              placeholder={"Kiss Anna\nNagy Bence"}
              value={learnerText}
              onChange={(event) => setLearnerText(event.target.value)}
            />
          </label>
        </section>
        <section className="panel stack">
          <h2>2. Helyszín és kurzus</h2>
          <div className="two-cols">
            <label>
              Helyszín neve
              <input
                placeholder="Matematika terem"
                value={locationTitle}
                onChange={(event) => setLocationTitle(event.target.value)}
              />
            </label>
            <label>
              Terem
              <input
                placeholder="M12"
                value={room}
                onChange={(event) => setRoom(event.target.value)}
              />
            </label>
          </div>
          <label>
            Kurzus neve
            <input
              placeholder="8. osztály matematika"
              value={courseTitle}
              onChange={(event) => setCourseTitle(event.target.value)}
            />
          </label>
          <div className="diagnostic">
            <strong>Mi jön ezután?</strong>
            <p>
              A kurzus mentése után létrehozhatsz egy fogalmat, feladatot és
              óratervet. A demo tartalom nem kerül bele ebbe a munkatérbe.
            </p>
          </div>
          {setup.error && (
            <div className="error" role="alert">
              {setup.error instanceof ApiError &&
              Object.keys(setup.error.fieldErrors).length
                ? "Ellenőrizd a kötelező mezőket."
                : `A beállítás sikertelen: ${setup.error.message}`}
            </div>
          )}
          <button disabled={!canSubmit || setup.isPending}>
            {setup.isPending ? "Munkatér létrehozása…" : "Kurzus létrehozása"}
          </button>
        </section>
      </form>
    </>
  );
}
