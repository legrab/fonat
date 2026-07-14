import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import {
  authenticate,
  createDemoState,
  FixedClock,
  gradeExercise,
  id,
  SystemClock,
  allowedRunTransition,
  type Clock,
  type LessonRun,
  type Submission,
  type WorkspaceState,
} from "@fonat/application";
import {
  err,
  exerciseSchema,
  ok,
  type Entity,
  type Exercise,
  type Lesson,
} from "@fonat/contracts";
import {
  MemoryPersistence,
  MongoStatePersistence,
  WorkspaceStore,
} from "@fonat/persistence-mongodb";
import { readConfig, type AppConfig } from "./config.js";

const collectionMap = {
  subjects: "subjects",
  "learner-groups": "learnerGroups",
  learners: "learners",
  enrollments: "enrollments",
  courses: "courses",
  locations: "locations",
  nodes: "nodes",
  relations: "relations",
  collections: "collections",
  "annual-plans": "annualPlans",
  phases: "phases",
  lessons: "lessons",
  exercises: "exercises",
  assignments: "assignments",
  evidence: "evidence",
  grades: "grades",
  "assessment-blueprints": "assessmentBlueprints",
  assessments: "assessments",
  "assessment-deliveries": "assessmentDeliveries",
  findings: "findings",
  projects: "projects",
} as const;
type CollectionRoute = keyof typeof collectionMap;
const publicPrefixes = [
  "/api/auth/status",
  "/api/auth/bootstrap",
  "/api/auth/login",
  "/api/live/join",
  "/api/live/public",
  "/api/live/answer",
  "/api/assignments/public",
  "/api/assessment-deliveries/public",
  "/api/admin/health",
  "/api/health",
  "/docs",
];

export type AppContext = {
  app: FastifyInstance;
  store: WorkspaceStore;
  config: AppConfig;
  close: () => Promise<void>;
};
const safeUser = (u: any) => {
  const { passwordHash, ...rest } = u;
  return rest;
};
const cookieOptions = (config: AppConfig) => ({
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: config.RUNTIME_PROFILE === "production",
  maxAge: 8 * 60 * 60,
});

export async function createApp(
  options: {
    env?: NodeJS.ProcessEnv;
    clock?: Clock;
    store?: WorkspaceStore;
    logger?: boolean;
  } = {},
): Promise<AppContext> {
  const config = readConfig(options.env);
  const clock =
    options.clock ??
    (config.RUNTIME_PROFILE === "demo" ? new FixedClock() : new SystemClock());
  const persistence = config.MONGODB_URI
    ? new MongoStatePersistence(config.MONGODB_URI, config.MONGODB_DB)
    : new MemoryPersistence();
  const store =
    options.store ??
    (await new WorkspaceStore(persistence, () =>
      createDemoState(clock),
    ).init());
  if (options.store) await options.store.init().catch(() => undefined);
  await store
    .mutate((state) => {
      state.features.projects = config.projectsEnabled;
    })
    .catch(() => undefined);
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: true,
    bodyLimit: 2_000_000,
  });
  await app.register(cookie, { secret: config.SESSION_SECRET });
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || config.allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("Origin not allowed"), false);
    },
    credentials: true,
  });
  await app.register(rateLimit, { max: 180, timeWindow: "1 minute" });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Fonat API",
        version: "0.3.0",
        description: "Teacher-first educational operating system API",
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  app.addHook("onRequest", async (req, reply) => {
    if (
      req.method === "OPTIONS" ||
      !req.url.startsWith("/api/") ||
      publicPrefixes.some((p) => req.url.startsWith(p))
    )
      return;
    const sid = req.cookies.fonat_session;
    if (!sid) {
      return reply.code(401).send(err("AUTH_REQUIRED", "auth.required"));
    }
    const state = store.snapshot();
    const session = state.sessions.find(
      (s) =>
        s.id === sid && !s.invalidatedAt && new Date(s.expiresAt) > clock.now(),
    );
    const user = session
      ? state.users.find((u) => u.id === session.userId && !u.disabled)
      : undefined;
    if (!user) {
      reply.clearCookie("fonat_session", cookieOptions(config));
      return reply
        .code(401)
        .send(err("SESSION_EXPIRED", "auth.sessionExpired"));
    }
    (req as any).auth = { user: safeUser(user), session };
  });
  app.addHook("onSend", async (_req, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "same-origin");
    reply.header(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    return payload;
  });

  app.get("/api/health", async () =>
    ok({
      status: "ok",
      profile: config.RUNTIME_PROFILE,
      persistence: config.MONGODB_URI ? "mongodb" : "memory",
      version: store.snapshot().version,
    }),
  );
  app.get("/api/admin/health", async () =>
    ok({ status: "ok", counts: summarize(store.snapshot()) }),
  );
  app.get("/api/auth/status", async () => {
    const state = store.snapshot();
    return ok({
      requiresBootstrap: state.users.length === 0,
      demoCredentials:
        config.RUNTIME_PROFILE !== "production"
          ? { email: "admin@fonat.local", password: "fonat-demo" }
          : undefined,
    });
  });
  app.post(
    "/api/auth/bootstrap",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const body = req.body as any;
      if (!body?.email || !body?.password || String(body.password).length < 8)
        return reply.code(400).send(err("VALIDATION", "auth.bootstrapInvalid"));
      const result = await store.mutate(async (state) => {
        if (state.users.length > 0)
          return err("ALREADY_BOOTSTRAPPED", "auth.alreadyBootstrapped");
        const user = {
          id: id("user"),
          email: String(body.email).toLowerCase(),
          displayName: String(body.displayName || "Admin"),
          passwordHash: await bcrypt.hash(String(body.password), 10),
          roles: ["admin", "teacher"],
          disabled: false,
          temporaryPassword: false,
        };
        state.users.push(user);
        return ok(safeUser(user));
      });
      return result;
    },
  );
  app.post(
    "/api/auth/login",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const body = req.body as any;
      const result = await store.mutate((state) =>
        authenticate(
          state,
          String(body?.email || ""),
          String(body?.password || ""),
          clock,
        ),
      );
      if (result.ok) {
        reply.setCookie(
          "fonat_session",
          result.value.session.id,
          cookieOptions(config),
        );
        return ok({ user: result.value.user });
      }
      return reply.code(401).send(result);
    },
  );
  app.get("/api/auth/me", async (req) => ok((req as any).auth.user));
  app.post("/api/auth/logout", async (req, reply) => {
    const sid = req.cookies.fonat_session;
    if (sid)
      await store.mutate((state) => {
        const s = state.sessions.find((x) => x.id === sid);
        if (s) s.invalidatedAt = clock.now().toISOString();
        state.audit.push({
          id: id("audit"),
          title: "Logout",
          at: clock.now().toISOString(),
          userId: (req as any).auth?.user?.id,
        });
      });
    reply.clearCookie("fonat_session", cookieOptions(config));
    return ok({ loggedOut: true });
  });

  app.get("/api/workspace/summary", async () =>
    ok(summarize(store.snapshot())),
  );
  app.get("/api/today", async () => {
    const state = store.snapshot();
    return ok({
      date: clock.now().toISOString().slice(0, 10),
      lessons: state.lessons.slice(0, 5),
      activeRuns: state.lessonRuns.filter(
        (r) => r.state === "active" || r.state === "paused",
      ),
      assignments: state.assignments.slice(0, 4),
      findings: state.findings.slice(0, 4),
    });
  });
  app.get("/api/timetable", async () => {
    const state = store.snapshot();
    const entries = state.lessons.map((l, i) => ({
      id: `tt.${l.id}`,
      lessonId: l.id,
      title: l.title,
      date: l.scheduledDate ?? "2026-09-15",
      start: ["08:00", "09:00", "10:00"][i % 3],
      end: ["08:45", "09:45", "10:45"][i % 3],
      courseId: l.courseId,
      locationId: (state.courses.find((c) => c.id === l.courseId) as any)
        ?.defaultLocationId,
      overlap: i === 1,
    }));
    return ok(entries);
  });

  for (const route of Object.keys(collectionMap) as CollectionRoute[]) {
    app.get(`/api/${route}`, async (req, reply) => {
      if (route === "projects" && !store.snapshot().features.projects)
        return reply
          .code(404)
          .send(err("FEATURE_DISABLED", "feature.projectsDisabled"));
      const q = req.query as any;
      const limit = Math.min(100, Math.max(1, Number(q.limit) || 40));
      const search = String(q.search || "").toLocaleLowerCase("hu");
      const all = (store.snapshot() as any)[collectionMap[route]] as Entity[];
      const filtered = search
        ? all.filter((x) =>
            JSON.stringify(x).toLocaleLowerCase("hu").includes(search),
          )
        : all;
      const start = q.cursor
        ? Math.max(0, filtered.findIndex((x) => x.id === q.cursor) + 1)
        : 0;
      const items = filtered.slice(start, start + limit);
      return ok(items, {
        nextCursor:
          start + limit < filtered.length ? items.at(-1)?.id : undefined,
      });
    });
    app.get(`/api/${route}/:id`, async (req, reply) => {
      const item = (
        (store.snapshot() as any)[collectionMap[route]] as Entity[]
      ).find((x) => x.id === (req.params as any).id);
      return item
        ? ok(item)
        : reply.code(404).send(err("NOT_FOUND", "common.notFound"));
    });
    app.post(`/api/${route}`, async (req, reply) => {
      if (route === "projects" && !store.snapshot().features.projects)
        return reply
          .code(404)
          .send(err("FEATURE_DISABLED", "feature.projectsDisabled"));
      const body = { ...(req.body as any) };
      if (route === "exercises") {
        const parsed = exerciseSchema.safeParse({
          ...body,
          expectedMinutes: Number(body.expectedMinutes),
          difficulty: Number(body.difficulty),
        });
        if (!parsed.success)
          return reply
            .code(400)
            .send(
              err(
                "VALIDATION",
                "exercise.invalid",
                false,
                parsed.error.flatten().fieldErrors as any,
              ),
            );
        body.options = parsed.data.options;
        Object.assign(body, parsed.data);
      }
      const item = await store.mutate((state) => {
        const value = {
          ...body,
          id: body.id || id(route.replaceAll("-", "")),
          concurrencyVersion: 1,
          createdAt: clock.now().toISOString(),
          updatedAt: clock.now().toISOString(),
        };
        ((state as any)[collectionMap[route]] as Entity[]).push(value);
        return value;
      });
      return reply.code(201).send(ok(item));
    });
    app.patch(`/api/${route}/:id`, async (req, reply) => {
      const expected = Number(
        req.headers["if-match"] ?? (req.body as any)?.concurrencyVersion ?? 0,
      );
      const result = await store.mutate((state) => {
        const list = (state as any)[collectionMap[route]] as Entity[];
        const index = list.findIndex((x) => x.id === (req.params as any).id);
        if (index < 0) return err("NOT_FOUND", "common.notFound");
        const current = list[index]!;
        if (expected && Number(current.concurrencyVersion) !== expected)
          return err("CONFLICT", "common.staleWrite", true);
        const next = {
          ...current,
          ...(req.body as any),
          id: current.id,
          concurrencyVersion: Number(current.concurrencyVersion || 1) + 1,
          updatedAt: clock.now().toISOString(),
        };
        list[index] = next;
        return ok(next);
      });
      return result.ok
        ? result
        : reply.code(result.error.code === "CONFLICT" ? 409 : 404).send(result);
    });
  }

  app.get("/api/admin/users", async () =>
    ok(store.snapshot().users.map(safeUser)),
  );
  app.post("/api/admin/users", async (req, reply) => {
    const b = req.body as any;
    const user = await store.mutate(async (state) => {
      const value = {
        id: id("user"),
        email: String(b.email).toLowerCase(),
        displayName: String(b.displayName),
        passwordHash: await bcrypt.hash(
          String(b.password || "temporary123"),
          10,
        ),
        roles: Array.isArray(b.roles) ? b.roles : ["teacher"],
        disabled: false,
        temporaryPassword: true,
      };
      state.users.push(value);
      return safeUser(value);
    });
    return reply.code(201).send(ok(user));
  });
  app.patch("/api/admin/users/:id", async (req, reply) => {
    const result = await store.mutate((state) => {
      const user = state.users.find((u) => u.id === (req.params as any).id);
      if (!user) return err("NOT_FOUND", "common.notFound");
      Object.assign(user, req.body as any);
      if (user.disabled)
        state.sessions
          .filter((s) => s.userId === user.id)
          .forEach((s) => (s.invalidatedAt = clock.now().toISOString()));
      return ok(safeUser(user));
    });
    return result.ok ? result : reply.code(404).send(result);
  });
  app.get("/api/admin/features", async () => ok(store.snapshot().features));
  app.patch("/api/admin/features", async (req) =>
    ok(
      await store.mutate((state) =>
        Object.assign(state.features, req.body as any),
      ),
    ),
  );

  app.post("/api/lesson-runs/start", async (req, reply) => {
    const lessonId = String((req.body as any)?.lessonId);
    const state = store.snapshot();
    if (!state.lessons.some((l) => l.id === lessonId))
      return reply.code(404).send(err("NOT_FOUND", "lesson.notFound"));
    const data = await store.mutate((s) => {
      let run = s.lessonRuns.find(
        (r) =>
          r.lessonId === lessonId &&
          (r.state === "active" || r.state === "paused"),
      );
      if (!run) {
        run = {
          id: id("run"),
          lessonId,
          state: "active",
          currentSlideIndex: 0,
          startedAt: clock.now().toISOString(),
        };
        s.lessonRuns.push(run);
      } else run.state = "active";
      let live = s.liveSessions.find(
        (x) => x.lessonRunId === run!.id && x.status === "active",
      );
      if (!live) {
        live = {
          id: id("live"),
          code: String(Math.floor(100000 + Math.random() * 900000)),
          lessonRunId: run.id,
          lessonId,
          status: "active",
          reveal: false,
          currentSlideIndex: run.currentSlideIndex,
          createdAt: clock.now().toISOString(),
        };
        s.liveSessions.push(live);
      }
      return { run, live };
    });
    return reply.code(201).send(ok(data));
  });
  app.patch("/api/lesson-runs/:id/transition", async (req, reply) => {
    const to = String((req.body as any)?.to) as LessonRun["state"];
    const result = await store.mutate((state) => {
      const run = state.lessonRuns.find((r) => r.id === (req.params as any).id);
      if (!run) return err("NOT_FOUND", "run.notFound");
      if (!allowedRunTransition(run.state, to))
        return err("INVALID_TRANSITION", "run.invalidTransition");
      run.state = to;
      if (to === "completed") run.completedAt = clock.now().toISOString();
      const live = state.liveSessions.find(
        (x) => x.lessonRunId === run.id && x.status === "active",
      );
      if (live && to === "completed") live.status = "completed";
      return ok(run);
    });
    return result.ok
      ? result
      : reply.code(result.error.code === "NOT_FOUND" ? 404 : 409).send(result);
  });
  app.patch("/api/lesson-runs/:id/slide", async (req, reply) => {
    const index = Number((req.body as any)?.index);
    const result = await store.mutate((state) => {
      const run = state.lessonRuns.find((r) => r.id === (req.params as any).id);
      if (!run) return err("NOT_FOUND", "run.notFound");
      const lesson = state.lessons.find((l) => l.id === run.lessonId);
      if (!lesson || index < 0 || index >= lesson.slides.length)
        return err("VALIDATION", "run.invalidSlide");
      run.currentSlideIndex = index;
      const live = state.liveSessions.find(
        (x) => x.lessonRunId === run.id && x.status === "active",
      );
      if (live) live.currentSlideIndex = index;
      return ok(run);
    });
    return result.ok ? result : reply.code(400).send(result);
  });

  app.post("/api/live/join", async (req, reply) => {
    const b = req.body as any;
    const result = await store.mutate((state) => {
      const live = state.liveSessions.find(
        (x) => x.code === String(b.code) && x.status === "active",
      );
      if (!live) return err("NOT_FOUND", "live.codeNotFound");
      const participant = {
        id: id("participant"),
        sessionId: live.id,
        nickname: String(
          b.nickname || `Vendég ${state.participants.length + 1}`,
        ),
        badge: ["🦉", "🐿️", "🦡", "🐇"][state.participants.length % 4]!,
        token: crypto.randomUUID(),
        joinedAt: clock.now().toISOString(),
      };
      state.participants.push(participant);
      return ok({
        participantToken: participant.token,
        participantId: participant.id,
        sessionId: live.id,
      });
    });
    return result.ok ? result : reply.code(404).send(result);
  });
  app.get("/api/live/public/:id", async (req, reply) => {
    const state = store.snapshot();
    const live = state.liveSessions.find(
      (x) =>
        x.id === (req.params as any).id || x.code === (req.params as any).id,
    );
    if (!live) return reply.code(404).send(err("NOT_FOUND", "live.notFound"));
    const lesson = state.lessons.find((l) => l.id === live.lessonId)!;
    const slide = lesson.slides[live.currentSlideIndex];
    const exercise = slide?.exerciseId
      ? state.exercises.find((e) => e.id === slide.exerciseId)
      : undefined;
    const answers = state.liveAnswers.filter((a) => a.sessionId === live.id);
    const participants = state.participants.filter(
      (p) => p.sessionId === live.id,
    );
    return ok({
      session: {
        id: live.id,
        code: live.code,
        status: live.status,
        reveal: live.reveal,
        currentSlideIndex: live.currentSlideIndex,
      },
      lesson: { id: lesson.id, title: lesson.title },
      slide,
      exercise: exercise ? publicExercise(exercise, live.reveal) : undefined,
      responseCount: answers.length,
      participantCount: participants.length,
      results: live.reveal
        ? aggregate(exercise, answers, participants)
        : undefined,
    });
  });
  app.post(
    "/api/live/answer",
    { config: { rateLimit: { max: 40, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const b = req.body as any;
      const result = await store.mutate((state) => {
        const participant = state.participants.find(
          (p) => p.token === String(b.participantToken),
        );
        if (!participant) return err("AUTH_INVALID", "live.invalidCredential");
        const live = state.liveSessions.find(
          (x) => x.id === participant.sessionId && x.status === "active",
        );
        if (!live) return err("SESSION_CLOSED", "live.closed");
        const existing = state.liveAnswers.find(
          (a) => a.sessionId === live.id && a.participantId === participant.id,
        );
        if (existing)
          return ok({ status: "already-accepted", answerId: existing.id });
        const lesson = state.lessons.find((l) => l.id === live.lessonId)!;
        const slide = lesson.slides[live.currentSlideIndex];
        const exercise = slide?.exerciseId
          ? state.exercises.find((e) => e.id === slide.exerciseId)
          : undefined;
        if (!exercise) return err("VALIDATION", "live.noActiveExercise");
        const answer = {
          id: id("answer"),
          participantId: participant.id,
          sessionId: live.id,
          answer: b.answer,
          acceptedAt: clock.now().toISOString(),
          correct: gradeExercise(exercise, b.answer),
        };
        state.liveAnswers.push(answer);
        return ok({ status: "accepted", answerId: answer.id });
      });
      return result.ok ? result : reply.code(400).send(result);
    },
  );
  app.get("/api/live/:id/results", async (req, reply) => {
    const state = store.snapshot();
    const live = state.liveSessions.find(
      (x) => x.id === (req.params as any).id,
    );
    if (!live) return reply.code(404).send(err("NOT_FOUND", "live.notFound"));
    const lesson = state.lessons.find((l) => l.id === live.lessonId)!;
    const slide = lesson.slides[live.currentSlideIndex];
    const exercise = slide?.exerciseId
      ? state.exercises.find((e) => e.id === slide.exerciseId)
      : undefined;
    return ok(
      aggregate(
        exercise,
        state.liveAnswers.filter((a) => a.sessionId === live.id),
        state.participants.filter((p) => p.sessionId === live.id),
      ),
    );
  });
  app.post("/api/live/:id/reveal", async (req, reply) => {
    const result = await store.mutate((state) => {
      const live = state.liveSessions.find(
        (x) => x.id === (req.params as any).id,
      );
      if (!live) return err("NOT_FOUND", "live.notFound");
      live.reveal = Boolean((req.body as any)?.reveal ?? true);
      return ok(live);
    });
    return result.ok ? result : reply.code(404).send(result);
  });

  app.get("/api/assignments/public", async (req) => {
    const learnerId = String(
      (req.query as any)?.learnerId || "learner.hedgehog",
    );
    const state = store.snapshot();
    return ok(
      state.assignments
        .filter((a: any) => a.status === "assigned")
        .map((a) => ({
          ...a,
          draft: state.drafts.find(
            (d: any) => d.assignmentId === a.id && d.learnerId === learnerId,
          ),
          submissions: state.submissions.filter(
            (s) => s.assignmentId === a.id && s.learnerId === learnerId,
          ),
        })),
    );
  });
  app.put("/api/assignments/public/:id/draft", async (req, reply) => {
    const b = req.body as any;
    const value = await store.mutate((state) => {
      let draft = state.drafts.find(
        (d: any) =>
          d.assignmentId === (req.params as any).id &&
          d.learnerId === b.learnerId,
      );
      if (draft) {
        Object.assign(draft, {
          answers: b.answers,
          concurrencyVersion: Number(draft.concurrencyVersion || 1) + 1,
          updatedAt: clock.now().toISOString(),
        });
      } else {
        draft = {
          id: id("draft"),
          assignmentId: (req.params as any).id,
          learnerId: b.learnerId,
          answers: b.answers || {},
          concurrencyVersion: 1,
          updatedAt: clock.now().toISOString(),
        };
        state.drafts.push(draft);
      }
      return draft;
    });
    return reply.send(ok(value));
  });
  app.post("/api/assignments/public/:id/submit", async (req, reply) => {
    const b = req.body as any;
    const result = await store.mutate((state) => {
      const assignment = state.assignments.find(
        (a) => a.id === (req.params as any).id,
      );
      if (!assignment) return err("NOT_FOUND", "assignment.notFound");
      const attempts = state.submissions.filter(
        (s) => s.assignmentId === assignment.id && s.learnerId === b.learnerId,
      );
      const submission: Submission = {
        id: id("submission"),
        title: `${assignment.title} beadás`,
        assignmentId: assignment.id,
        learnerId: b.learnerId,
        attemptNumber: attempts.length + 1,
        answers: structuredClone(b.answers || {}),
        status: attempts.length ? "resubmitted" : "submitted",
        submittedAt: clock.now().toISOString(),
        concurrencyVersion: 1,
      };
      state.submissions.push(submission);
      state.drafts = state.drafts.filter(
        (d: any) =>
          !(d.assignmentId === assignment.id && d.learnerId === b.learnerId),
      );
      return ok(submission);
    });
    return result.ok
      ? reply.code(201).send(result)
      : reply.code(404).send(result);
  });
  app.patch("/api/submissions/:id/review", async (req, reply) => {
    const b = req.body as any;
    const result = await store.mutate((state) => {
      const submission = state.submissions.find(
        (s) => s.id === (req.params as any).id,
      );
      if (!submission) return err("NOT_FOUND", "submission.notFound");
      submission.status = b.decision === "return" ? "returned" : "accepted";
      submission.feedback = String(b.feedback || "");
      state.evidence.push({
        id: id("evidence"),
        title: `${submission.title} evidencia`,
        learnerId: submission.learnerId,
        assignmentId: submission.assignmentId,
        status: submission.status,
        at: clock.now().toISOString(),
      });
      return ok(submission);
    });
    return result.ok ? result : reply.code(404).send(result);
  });
  app.get("/api/submissions", async () => ok(store.snapshot().submissions));

  app.post("/api/assessments/generate", async (req, reply) => {
    const b = req.body as any;
    const generated = await store.mutate((state) => {
      const blueprint = state.assessmentBlueprints.find(
        (x) => x.id === String(b.blueprintId),
      ) as any;
      if (!blueprint) return null;
      const assessment = {
        id: id("assessment"),
        title: `${blueprint.title} A/B`,
        blueprintId: blueprint.id,
        strategyId: "deterministic-slot-fill",
        strategyVersion: "1",
        seed: String(b.seed || "fonat-2026"),
        status: "generated",
        createdAt: clock.now().toISOString(),
      };
      state.assessments.push(assessment);
      const learnerIds = (b.learnerIds ||
        state.learners.slice(0, 2).map((x) => x.id)) as string[];
      const deliveries = learnerIds.map((learnerId, index) => {
        const exerciseIds = state.exercises
          .slice(index, index + 6)
          .map((e) => e.id);
        const d = {
          id: id("delivery"),
          title: `${assessment.title} ${index % 2 ? "B" : "A"}`,
          assessmentId: assessment.id,
          learnerId,
          variant: index % 2 ? "B" : "A",
          seed: `${assessment.seed}:${learnerId}`,
          exerciseSnapshots: exerciseIds.map((eid) =>
            structuredClone(state.exercises.find((e) => e.id === eid)),
          ),
          answers: {},
          status: "available",
          createdAt: clock.now().toISOString(),
        };
        state.assessmentDeliveries.push(d);
        return d;
      });
      return { assessment, deliveries };
    });
    return generated
      ? reply.code(201).send(ok(generated))
      : reply.code(404).send(err("NOT_FOUND", "assessment.blueprintNotFound"));
  });
  app.get("/api/assessment-deliveries/public/:id", async (req, reply) => {
    const d = store
      .snapshot()
      .assessmentDeliveries.find((x) => x.id === (req.params as any).id);
    return d
      ? ok(d)
      : reply.code(404).send(err("NOT_FOUND", "assessment.deliveryNotFound"));
  });
  app.post(
    "/api/assessment-deliveries/public/:id/submit",
    async (req, reply) => {
      const b = req.body as any;
      const result = await store.mutate((state) => {
        const d = state.assessmentDeliveries.find(
          (x) => x.id === (req.params as any).id,
        ) as any;
        if (!d) return err("NOT_FOUND", "assessment.deliveryNotFound");
        if (d.status === "submitted" || d.status === "graded")
          return ok({ status: "already-submitted", delivery: d });
        d.answers = structuredClone(b.answers || {});
        d.status = "submitted";
        d.submittedAt = clock.now().toISOString();
        return ok({ status: "submitted", delivery: d });
      });
      return result.ok ? result : reply.code(404).send(result);
    },
  );
  app.post("/api/assessment-deliveries/:id/grade", async (req, reply) => {
    const result = await store.mutate((state) => {
      const d = state.assessmentDeliveries.find(
        (x) => x.id === (req.params as any).id,
      ) as any;
      if (!d) return err("NOT_FOUND", "assessment.deliveryNotFound");
      let correct = 0;
      for (const ex of d.exerciseSnapshots as Exercise[])
        if (gradeExercise(ex, d.answers?.[ex.id]) === true) correct++;
      d.score = {
        correct,
        total: d.exerciseSnapshots.length,
        percent: Math.round((100 * correct) / d.exerciseSnapshots.length),
      };
      d.status = "graded";
      state.grades.push({
        id: id("grade"),
        title: `${d.title} érdemjegy`,
        learnerId: d.learnerId,
        deliveryId: d.id,
        value:
          d.score.percent >= 80
            ? 5
            : d.score.percent >= 65
              ? 4
              : d.score.percent >= 50
                ? 3
                : d.score.percent >= 35
                  ? 2
                  : 1,
        recordedAt: clock.now().toISOString(),
      });
      return ok(d);
    });
    return result.ok ? result : reply.code(404).send(result);
  });

  app.post("/api/packages/demo-reset", async (req) => {
    const mode = String((req.body as any)?.mode || "demo");
    const next =
      mode === "blank" ? await blankState(clock) : await createDemoState(clock);
    const current = store.snapshot();
    next.users = current.users;
    next.sessions = current.sessions;
    await store.replace(next);
    return ok({ mode, summary: summarize(store.snapshot()) });
  });
  app.get("/api/packages/export", async (_req, reply) => {
    reply.header(
      "content-disposition",
      'attachment; filename="fonat-workspace.json"',
    );
    return store.snapshot();
  });
  app.get("/api/guide", async () =>
    ok({
      title: "Fonat Guide",
      sections: [
        {
          title: "Első lépések",
          body: "A Today oldalról nyisd meg a bemutató órát, vagy hozz létre saját tartalmat a Könyvtárban.",
        },
        {
          title: "Élő óra",
          body: "A tanári vezérlő kódját a tanulók a /join oldalon adják meg.",
        },
        {
          title: "Biztonság",
          body: "A Kilépés megszünteti a szerveroldali munkamenetet.",
        },
      ],
    }),
  );

  const webDist = path.resolve(process.cwd(), "apps/web/dist");
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist, prefix: "/" });
    app.setNotFoundHandler((req, reply) => {
      if (req.url.startsWith("/api/"))
        return reply.code(404).send(err("NOT_FOUND", "common.routeNotFound"));
      return reply.sendFile("index.html");
    });
  } else
    app.setNotFoundHandler((req, reply) =>
      reply
        .code(404)
        .send(
          req.url.startsWith("/api/")
            ? err("NOT_FOUND", "common.routeNotFound")
            : "Fonat web build not found. Run npm run build.",
        ),
    );
  await app.ready();
  return {
    app,
    store,
    config,
    close: async () => {
      await app.close();
      await store.close();
    },
  };
}

function publicExercise(exercise: Exercise, reveal: boolean) {
  const copy: any = { ...exercise };
  if (!reveal) {
    delete copy.correctOptionIds;
    delete copy.correctValue;
    delete copy.expectedValue;
    delete copy.acceptedVariants;
    delete copy.solutionMarkdown;
  }
  return copy;
}
function aggregate(
  exercise: Exercise | undefined,
  answers: any[],
  participants: any[],
) {
  const rows = participants.map((p) => {
    const a = answers.find((x) => x.participantId === p.id);
    return {
      participantId: p.id,
      nickname: p.nickname,
      badge: p.badge,
      status: a ? "answered" : "waiting",
      correct: a?.correct,
    };
  });
  const correct = answers.filter((a) => a.correct === true).length;
  const leaderboard = rows
    .filter((r) => r.status === "answered")
    .sort((a, b) => Number(b.correct) - Number(a.correct))
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return {
    exerciseId: exercise?.id,
    responseCount: answers.length,
    participantCount: participants.length,
    correct,
    incorrect: answers.filter((a) => a.correct === false).length,
    rows,
    leaderboard,
  };
}
function summarize(s: WorkspaceState) {
  return {
    subjects: s.subjects.length,
    courses: s.courses.length,
    learners: s.learners.length,
    concepts: s.nodes.filter((n: any) => n.type === "concept").length,
    exercises: s.exercises.length,
    lessons: s.lessons.length,
    assignments: s.assignments.length,
    submissions: s.submissions.length,
    assessments: s.assessments.length,
    findings: s.findings.length,
    projects: s.features.projects ? s.projects.length : 0,
  };
}
async function blankState(clock: Clock) {
  const state = await createDemoState(clock);
  state.subjects = [];
  state.learnerGroups = [];
  state.learners = [];
  state.enrollments = [];
  state.courses = [];
  state.locations = [];
  state.nodes = [];
  state.relations = [];
  state.collections = [];
  state.annualPlans = [];
  state.phases = [];
  state.lessons = [];
  state.exercises = [];
  state.lessonRuns = [];
  state.liveSessions = [];
  state.participants = [];
  state.liveAnswers = [];
  state.assignments = [];
  state.drafts = [];
  state.submissions = [];
  state.evidence = [];
  state.grades = [];
  state.assessmentBlueprints = [];
  state.assessments = [];
  state.assessmentDeliveries = [];
  state.findings = [];
  state.projects = [];
  state.audit = [
    {
      id: id("audit"),
      title: "Blank workspace initialized",
      at: clock.now().toISOString(),
    },
  ];
  return state;
}
