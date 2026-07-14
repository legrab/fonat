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
});
