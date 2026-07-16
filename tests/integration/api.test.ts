import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp, type AppContext } from "../../apps/server/src/app";
let ctx: AppContext;
beforeEach(async () => {
  ctx = await createApp({
    env: {
      ...process.env,
      RUNTIME_PROFILE: "test",
      MONGODB_URI: "",
      SESSION_SECRET: "integration-test-secret-at-least-32-characters",
      ALLOWED_ORIGINS: "http://localhost",
    },
  });
});
afterEach(async () => ctx.close());
async function login() {
  const r = await ctx.app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "admin@fonat.local", password: "fonat-demo" },
  });
  expect(r.statusCode).toBe(200);
  return r.cookies.find((c) => c.name === "fonat_session")!.value;
}
describe("critical API workflow", () => {
  it("invalidates logout session", async () => {
    const cookie = await login();
    expect(
      (
        await ctx.app.inject({
          method: "GET",
          url: "/api/auth/me",
          cookies: { fonat_session: cookie },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await ctx.app.inject({
          method: "POST",
          url: "/api/auth/logout",
          cookies: { fonat_session: cookie },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await ctx.app.inject({
          method: "GET",
          url: "/api/auth/me",
          cookies: { fonat_session: cookie },
        })
      ).statusCode,
    ).toBe(401);
  });
  it("accepts live answers idempotently and aggregates", async () => {
    const cookie = await login();
    const start = await ctx.app.inject({
      method: "POST",
      url: "/api/lesson-runs/start",
      cookies: { fonat_session: cookie },
      payload: { lessonId: "lesson.demo-presentation" },
    });
    const data = start.json().value;
    await ctx.app.inject({
      method: "PATCH",
      url: `/api/lesson-runs/${data.run.id}/slide`,
      cookies: { fonat_session: cookie },
      payload: { index: 4 },
    });
    const join = await ctx.app.inject({
      method: "POST",
      url: "/api/live/join",
      payload: { code: data.live.code, nickname: "Bagoly" },
    });
    const token = join.json().value.participantToken;
    const first = await ctx.app.inject({
      method: "POST",
      url: "/api/live/answer",
      payload: { participantToken: token, answer: 10 },
    });
    const second = await ctx.app.inject({
      method: "POST",
      url: "/api/live/answer",
      payload: { participantToken: token, answer: 10 },
    });
    expect(first.json().value.status).toBe("accepted");
    expect(second.json().value.status).toBe("already-accepted");
    const results = await ctx.app.inject({
      method: "GET",
      url: `/api/live/${data.live.id}/results`,
      cookies: { fonat_session: cookie },
    });
    expect(results.json().value.responseCount).toBe(1);
    expect(results.json().value.correct).toBe(1);
  });
  it("preserves immutable submission attempts", async () => {
    const first = await ctx.app.inject({
      method: "POST",
      url: "/api/assignments/public/assignment.hypotenuse/submit",
      payload: {
        learnerId: "learner.hedgehog",
        answers: { response: "10 cm" },
      },
    });
    expect(first.statusCode).toBe(201);
    const cookie = await login();
    const review = await ctx.app.inject({
      method: "PATCH",
      url: `/api/submissions/${first.json().value.id}/review`,
      cookies: { fonat_session: cookie },
      payload: { decision: "return", feedback: "Írj ellenőrzést" },
    });
    expect(review.json().value.status).toBe("returned");
    const second = await ctx.app.inject({
      method: "POST",
      url: "/api/assignments/public/assignment.hypotenuse/submit",
      payload: {
        learnerId: "learner.hedgehog",
        answers: { response: "10 cm, mert 36+64=100" },
      },
    });
    expect(second.json().value.attemptNumber).toBe(2);
    expect(ctx.store.snapshot().submissions).toHaveLength(2);
  });
  it("creates the first real course atomically without demo identifiers", async () => {
    const cookie = await login();
    const reset = await ctx.app.inject({
      method: "POST",
      url: "/api/packages/demo-reset",
      cookies: { fonat_session: cookie },
      payload: { mode: "blank" },
    });
    expect(reset.statusCode).toBe(200);
    const onboarding = await ctx.app.inject({
      method: "POST",
      url: "/api/onboarding/complete",
      cookies: { fonat_session: cookie },
      payload: {
        subjectTitle: "Biológia",
        groupTitle: "7. b",
        schoolYear: "2026/27",
        learnerNames: ["Anna", "Bence"],
        locationTitle: "Természettudományi terem",
        room: "T2",
        courseTitle: "7. b biológia",
        timezone: "Europe/Budapest",
      },
    });
    expect(onboarding.statusCode).toBe(201);
    const state = ctx.store.snapshot();
    expect(state.courses).toHaveLength(1);
    expect(state.learners).toHaveLength(2);
    expect(state.enrollments).toHaveLength(2);
    expect(JSON.stringify(onboarding.json().value)).not.toContain("demo");
  });
  it("persists the exact edited lesson activity order and teacher-only fields", async () => {
    const cookie = await login();
    const create = await ctx.app.inject({
      method: "POST",
      url: "/api/lessons",
      cookies: { fonat_session: cookie },
      payload: {
        title: "Saját szerkesztett óra",
        courseId: "course.grade8-math",
        locationId: "location.math-room",
        scheduledDate: "2026-10-01",
        durationMinutes: 45,
        teacherNotes: "Csak a tanár láthatja.",
        status: "draft",
        slides: [
          {
            id: "activity.intro",
            type: "section-intro",
            title: "Kezdés",
            body: "Ráhangolás",
          },
          {
            id: "activity.quiz",
            type: "live-quiz",
            title: "Ellenőrzés",
            body: "Válaszolj!",
            exerciseId: "exercise.missing-hypotenuse-6-8",
          },
          {
            id: "activity.homework",
            type: "homework",
            title: "Lezárás",
            body: "Gyakorolj!",
          },
        ],
      },
    });
    expect(create.statusCode).toBe(201);
    const lesson = create.json().value;
    const read = await ctx.app.inject({
      method: "GET",
      url: `/api/lessons/${lesson.id}`,
      cookies: { fonat_session: cookie },
    });
    expect(
      read.json().value.slides.map((slide: { id: string }) => slide.id),
    ).toEqual(["activity.intro", "activity.quiz", "activity.homework"]);
    expect(read.json().value.teacherNotes).toBe("Csak a tanár láthatja.");
  });
  it("rejects duplicate and self-referencing material relations", async () => {
    const cookie = await login();
    const relation = {
      type: "requires",
      sourceId: "concept.1",
      targetId: "concept.2",
    };
    const first = await ctx.app.inject({
      method: "POST",
      url: "/api/relations",
      cookies: { fonat_session: cookie },
      payload: relation,
    });
    expect(first.statusCode).toBe(201);
    const duplicate = await ctx.app.inject({
      method: "POST",
      url: "/api/relations",
      cookies: { fonat_session: cookie },
      payload: relation,
    });
    expect(duplicate.statusCode).toBe(400);
    expect(duplicate.json().error.code).toBe("VALIDATION");
    const selfReference = await ctx.app.inject({
      method: "POST",
      url: "/api/relations",
      cookies: { fonat_session: cookie },
      payload: {
        type: "requires",
        sourceId: "concept.1",
        targetId: "concept.1",
      },
    });
    expect(selfReference.statusCode).toBe(400);
  });
  it("previews assessment slots and records explained manual grading", async () => {
    const cookie = await login();
    const blueprint = await ctx.app.inject({
      method: "POST",
      url: "/api/assessment-blueprints",
      cookies: { fonat_session: cookie },
      payload: {
        title: "Kétfogalmas próba",
        courseId: "course.grade8-math",
        status: "published",
        slots: [
          { id: "slot.square", conceptId: "concept.1", points: 2 },
          { id: "slot.power", conceptId: "concept.2", points: 3 },
        ],
      },
    });
    const blueprintId = blueprint.json().value.id;
    const preview = await ctx.app.inject({
      method: "POST",
      url: "/api/assessments/preview",
      cookies: { fonat_session: cookie },
      payload: { blueprintId },
    });
    expect(preview.statusCode).toBe(200);
    expect(
      preview
        .json()
        .value.slots.every(
          (slot: { eligibleCount: number }) => slot.eligibleCount > 0,
        ),
    ).toBe(true);
    const generate = await ctx.app.inject({
      method: "POST",
      url: "/api/assessments/generate",
      cookies: { fonat_session: cookie },
      payload: {
        blueprintId,
        learnerIds: ["learner.hedgehog"],
        seed: "test-seed",
      },
    });
    expect(generate.statusCode).toBe(201);
    const delivery = generate.json().value.deliveries[0];
    expect(delivery.exerciseSnapshots).toHaveLength(2);
    await ctx.app.inject({
      method: "POST",
      url: `/api/assessment-deliveries/public/${delivery.id}/submit`,
      payload: { answers: {} },
    });
    const grade = await ctx.app.inject({
      method: "POST",
      url: `/api/assessment-deliveries/${delivery.id}/grade`,
      cookies: { fonat_session: cookie },
      payload: {
        manualPercent: 72,
        overrideReason: "Szóbeli indoklás alapján.",
      },
    });
    expect(grade.statusCode).toBe(200);
    expect(grade.json().value.score).toMatchObject({
      percent: 72,
      manualOverride: true,
    });
    expect(
      ctx.store
        .snapshot()
        .findings.some((finding) => finding.deliveryId === delivery.id),
    ).toBe(true);
  });
});
