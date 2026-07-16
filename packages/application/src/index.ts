import bcrypt from "bcryptjs";
import type {
  Entity,
  Exercise,
  Lesson,
  LiveAnswer,
  Result,
} from "@fonat/contracts";
import { err, ok } from "@fonat/contracts";

export type User = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  roles: string[];
  disabled: boolean;
  temporaryPassword: boolean;
};
export type Session = {
  id: string;
  userId: string;
  expiresAt: string;
  invalidatedAt?: string;
};
export type Participant = {
  id: string;
  sessionId: string;
  nickname: string;
  badge: string;
  token: string;
  joinedAt: string;
};
export type LiveSession = {
  id: string;
  code: string;
  lessonRunId: string;
  lessonId: string;
  status: "active" | "completed";
  reveal: boolean;
  currentSlideIndex: number;
  createdAt: string;
};
export type LessonRun = {
  id: string;
  lessonId: string;
  state: "active" | "paused" | "completed" | "abandoned";
  currentSlideIndex: number;
  startedAt: string;
  completedAt?: string;
  note?: string;
};
export type Submission = Entity & {
  assignmentId: string;
  learnerId: string;
  attemptNumber: number;
  answers: Record<string, unknown>;
  status: "submitted" | "returned" | "resubmitted" | "accepted";
  submittedAt: string;
  feedback?: string;
};
export type WorkspaceState = {
  version: number;
  users: User[];
  sessions: Session[];
  subjects: Entity[];
  learnerGroups: Entity[];
  learners: Entity[];
  enrollments: Entity[];
  courses: Entity[];
  locations: Entity[];
  nodes: Entity[];
  relations: Entity[];
  collections: Entity[];
  annualPlans: Entity[];
  phases: Entity[];
  lessons: Lesson[];
  exercises: Exercise[];
  lessonRuns: LessonRun[];
  liveSessions: LiveSession[];
  participants: Participant[];
  liveAnswers: LiveAnswer[];
  assignments: Entity[];
  drafts: Entity[];
  submissions: Submission[];
  evidence: Entity[];
  grades: Entity[];
  assessmentBlueprints: Entity[];
  assessments: Entity[];
  assessmentDeliveries: Entity[];
  findings: Entity[];
  projects: Entity[];
  features: { projects: boolean };
  audit: Entity[];
};

export interface Clock {
  now(): Date;
}
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
export class FixedClock implements Clock {
  constructor(private readonly instant = "2026-09-15T08:00:00+02:00") {}
  now(): Date {
    return new Date(this.instant);
  }
}

export const id = (prefix: string) => `${prefix}.${crypto.randomUUID()}`;
const nowIso = (clock: Clock) => clock.now().toISOString();
const entity = (
  idValue: string,
  title: string,
  extra: Record<string, unknown> = {},
): Entity => ({ id: idValue, title, concurrencyVersion: 1, ...extra });

const conceptNames = [
  "Természetes szám négyzete",
  "Második hatvány",
  "Négyzetgyök",
  "Közelítő négyzetgyök",
  "Hosszúság és mértékegységek",
  "Mértékegység-átváltás",
  "Háromszög",
  "Derékszög",
  "Derékszögű háromszög",
  "Befogó",
  "Átfogó",
  "Négyzet területe",
  "Pitagorasz-tétel",
  "Az átfogó felismerése",
  "Hiányzó átfogó kiszámítása",
  "Hiányzó befogó kiszámítása",
  "Oldalhosszak ellenőrzése",
  "A Pitagorasz-tétel megfordítása",
  "Becslés és ellenőrzés",
  "Szöveges modellezés",
  "Téglalap átlója",
  "Koordináta-rendszer",
  "Két pont távolsága",
  "Területi szemléltetés",
];
const learners = [
  [
    "learner.red-panda",
    "Vörös Panda",
    "🦝",
    "Gyors számoló, néha rövid indoklással",
  ],
  ["learner.otter", "Vidra", "🦦", "Egyenletes és együttműködő"],
  ["learner.lynx", "Hiúz", "🐈", "Jó megoldások, bizonytalan önértékelés"],
  ["learner.hedgehog", "Sün", "🦔", "Lépésenkénti támasz segíti"],
  ["learner.fox", "Róka", "🦊", "Változó részvétel, erős pillanatok"],
];
const exerciseSeeds: Array<
  Partial<Exercise> & {
    id: string;
    title: string;
    exerciseType: Exercise["exerciseType"];
    promptMarkdown: string;
  }
> = [
  {
    id: "exercise.identify-hypotenuse-01",
    title: "Melyik az átfogó?",
    exerciseType: "single-choice",
    promptMarkdown: "A derékszögű háromszög melyik oldala az **átfogó**?",
    options: [
      { id: "a", text: "A derékszöggel szemközti oldal" },
      { id: "b", text: "Bármelyik rövidebb oldal" },
      { id: "c", text: "A függőleges oldal" },
    ],
    correctOptionIds: ["a"],
  },
  {
    id: "exercise.identify-hypotenuse-02",
    title: "Elforgatott háromszög",
    exerciseType: "single-choice",
    promptMarkdown:
      "A rajz elforgatása után is keresd a derékszöggel szemközti oldalt.",
    options: [
      { id: "a", text: "a" },
      { id: "b", text: "b" },
      { id: "c", text: "c" },
    ],
    correctOptionIds: ["c"],
  },
  {
    id: "exercise.square-values-recap",
    title: "Négyzetszámok",
    exerciseType: "accepted-text",
    promptMarkdown: "Írd le sorban 3², 4², 5² és 6² értékét.",
    acceptedVariants: ["9, 16, 25, 36", "9 16 25 36"],
    normalization: "trim-casefold",
  },
  {
    id: "exercise.square-root-recap",
    title: "Négyzetgyök ismétlés",
    exerciseType: "numeric",
    promptMarkdown: "Mennyi $\\sqrt{144}$?",
    expectedValue: 12,
    absoluteTolerance: 0,
  },
  {
    id: "exercise.discover-3-4-5",
    title: "A 3-4-5 kapcsolat",
    exerciseType: "manual-response",
    promptMarkdown:
      "Hasonlítsd össze a befogókra és az átfogóra rajzolt négyzetek területét.",
  },
  {
    id: "exercise.theorem-true-false",
    title: "Igaz vagy hamis?",
    exerciseType: "boolean",
    promptMarkdown: "Derékszögű háromszögben $a^2+b^2=c^2$.",
    correctValue: true,
  },
  {
    id: "exercise.missing-hypotenuse-6-8",
    title: "Hiányzó átfogó: 6 és 8",
    exerciseType: "numeric",
    promptMarkdown: "A befogók 6 cm és 8 cm. Mekkora az átfogó?",
    expectedValue: 10,
    absoluteTolerance: 0,
    acceptedUnit: "cm",
  },
  {
    id: "exercise.missing-hypotenuse-decimal",
    title: "Tizedes átfogó",
    exerciseType: "numeric",
    promptMarkdown:
      "A befogók 4,2 m és 5,1 m. Add meg az átfogót két tizedesre.",
    expectedValue: 6.61,
    absoluteTolerance: 0.02,
    acceptedUnit: "m",
  },
  {
    id: "exercise.missing-leg-13-5",
    title: "Hiányzó befogó: 13 és 5",
    exerciseType: "numeric",
    promptMarkdown:
      "Az átfogó 13 cm, az egyik befogó 5 cm. Mekkora a másik befogó?",
    expectedValue: 12,
    absoluteTolerance: 0,
    acceptedUnit: "cm",
  },
  {
    id: "exercise.missing-leg-common-mistake",
    title: "Találd meg a hibát",
    exerciseType: "single-choice",
    promptMarkdown: "Melyik az első hibás lépés a hiányzó befogó számításában?",
    options: [
      { id: "a", text: "c²=a²+b²" },
      { id: "b", text: "a²=c²-b²" },
      { id: "c", text: "a=c-b" },
    ],
    correctOptionIds: ["c"],
  },
  {
    id: "exercise.rectangle-diagonal",
    title: "Téglalap átlója",
    exerciseType: "numeric",
    promptMarkdown: "Egy 6 cm × 8 cm-es téglalap átlója hány cm?",
    expectedValue: 10,
    absoluteTolerance: 0,
    acceptedUnit: "cm",
  },
  {
    id: "exercise.ladder-wall",
    title: "Létra a falnál",
    exerciseType: "numeric",
    promptMarkdown:
      "Egy 5 m-es létra alja 3 m-re van a faltól. Milyen magasra ér?",
    expectedValue: 4,
    absoluteTolerance: 0.05,
    acceptedUnit: "m",
  },
  {
    id: "exercise.is-right-triangle",
    title: "Melyik derékszögű?",
    exerciseType: "multiple-choice",
    promptMarkdown: "Jelöld az összes derékszögű háromszög oldalhármasát.",
    options: [
      { id: "a", text: "3, 4, 5" },
      { id: "b", text: "5, 12, 13" },
      { id: "c", text: "4, 5, 6" },
    ],
    correctOptionIds: ["a", "b"],
  },
  {
    id: "exercise.converse-explanation",
    title: "A megfordítás indoklása",
    exerciseType: "manual-response",
    promptMarkdown:
      "Magyarázd el, hogyan döntöd el három oldalhosszból, hogy a háromszög derékszögű-e.",
  },
  {
    id: "exercise.coordinate-distance-01",
    title: "Pontok távolsága",
    exerciseType: "numeric",
    promptMarkdown: "Mekkora A(1,2) és B(4,6) távolsága?",
    expectedValue: 5,
    absoluteTolerance: 0,
  },
  {
    id: "exercise.coordinate-distance-02",
    title: "Nem egész távolság",
    exerciseType: "numeric",
    promptMarkdown: "Mekkora A(0,0) és B(2,3) távolsága?",
    expectedValue: 3.606,
    absoluteTolerance: 0.02,
  },
  {
    id: "exercise.choose-method",
    title: "Melyik módszer kell?",
    exerciseType: "single-choice",
    promptMarkdown: "Az átfogó és egy befogó ismert. Mit számítunk?",
    options: [
      { id: "a", text: "Hiányzó befogót" },
      { id: "b", text: "Hiányzó átfogót" },
      { id: "c", text: "Nem alkalmazható" },
    ],
    correctOptionIds: ["a"],
  },
  {
    id: "exercise.exit-ticket",
    title: "Kilépőkártya",
    exerciseType: "accepted-text",
    promptMarkdown: "Egy mondatban: mikor használható a Pitagorasz-tétel?",
    acceptedVariants: ["derékszögű háromszögben", "derékszögű háromszögnél"],
    normalization: "trim-casefold",
  },
];

export async function createDemoState(
  clock: Clock = new FixedClock(),
): Promise<WorkspaceState> {
  const passwordHash = await bcrypt.hash("fonat-demo", 10);
  const concepts = conceptNames.map((name, i) =>
    entity(`concept.${i + 1}`, name, {
      type: "concept",
      lifecycle: "published",
      currentRevision: 1,
    }),
  );
  const exercises: Exercise[] = exerciseSeeds.map((e, i) => ({
    id: e.id,
    title: e.title,
    exerciseType: e.exerciseType,
    promptMarkdown: e.promptMarkdown,
    solutionMarkdown: "",
    expectedMinutes: i === 4 ? 8 : 5,
    difficulty: Math.min(5, 2 + (i % 4)),
    lifecycle: "published",
    conceptIds: [concepts[Math.min(i, concepts.length - 1)]!.id],
    evidencePolicy: "light",
    contributionLevel: "practices",
    concurrencyVersion: 1,
    currentRevision: 1,
    ...(e.options ? { options: e.options } : {}),
    ...(e.correctOptionIds ? { correctOptionIds: e.correctOptionIds } : {}),
    ...(typeof e.correctValue === "boolean"
      ? { correctValue: e.correctValue }
      : {}),
    ...(typeof e.expectedValue === "number"
      ? { expectedValue: e.expectedValue }
      : {}),
    ...(typeof e.absoluteTolerance === "number"
      ? { absoluteTolerance: e.absoluteTolerance }
      : {}),
    ...(e.acceptedUnit ? { acceptedUnit: e.acceptedUnit } : {}),
    ...(e.acceptedVariants ? { acceptedVariants: e.acceptedVariants } : {}),
    ...(e.normalization ? { normalization: e.normalization } : {}),
  }));
  const demoSlides = [
    {
      id: "s1",
      type: "section-intro",
      title: "Felfedezés",
      body: "Szálról szálra összekötjük a négyzetek területét és a derékszögű háromszöget.",
    },
    {
      id: "s2",
      type: "concept",
      title: "Pitagorasz-tétel",
      body: "Derékszögű háromszögben: $a^2+b^2=c^2$, ahol $c$ az átfogó.",
    },
    {
      id: "s3",
      type: "visual",
      title: "Területi kép",
      body: "A két kisebb négyzet területe együtt kiadja a nagyobb négyzet területét.",
      imageSvg:
        '<svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="3-4-5 derékszögű háromszög és oldalaira rajzolt négyzetek"><rect x="20" y="110" width="72" height="72" rx="8" fill="none" stroke="currentColor" stroke-width="4"/><rect x="92" y="14" width="96" height="96" rx="8" fill="none" stroke="currentColor" stroke-width="4"/><path d="M92 110 L188 110 L92 182 Z" fill="none" stroke="currentColor" stroke-width="5"/><text x="48" y="153" font-size="20">3²</text><text x="124" y="66" font-size="20">4²</text><text x="125" y="145" font-size="20">5</text></svg>',
    },
    {
      id: "s4",
      type: "task",
      title: "Gondolkodó feladat",
      body: "Egy derékszögű háromszög befogói 6 cm és 8 cm. Becsüld meg, majd számítsd ki az átfogót.",
      exerciseId: "exercise.missing-hypotenuse-6-8",
    },
    {
      id: "s5",
      type: "live-quiz",
      title: "Élő kérdés",
      body: "A 6 és 8 cm-es befogókhoz tartozó átfogó:",
      exerciseId: "exercise.missing-hypotenuse-6-8",
    },
    {
      id: "s6",
      type: "response-status",
      title: "Válaszállapot",
      body: "A válaszok beérkezése név nélküli összesítésben követhető.",
    },
    {
      id: "s7",
      type: "results",
      title: "Eredmény és rangsor",
      body: "A helyes válasz felfedése a tanár kezében marad.",
    },
    {
      id: "s8",
      type: "solution",
      title: "Megoldás",
      body: "$c=\\sqrt{6^2+8^2}=\\sqrt{100}=10$ cm.",
    },
    {
      id: "s9",
      type: "timer",
      title: "Záró páros magyarázat",
      body: "Mondd el a párodnak, miért nem elég összeadni a két befogót.",
      durationSeconds: 8,
      timerEndBehavior: "advance" as const,
    },
    {
      id: "s10",
      type: "homework",
      title: "Házi feladat",
      body: "Oldd meg a hiányzó befogó feladatot, majd írj egy ellenőrző mondatot.",
    },
  ];
  const lessons: Lesson[] = [
    {
      id: "lesson.demo-presentation",
      title: "A Pitagorasz-tétel felfedezése",
      courseId: "course.grade8-math",
      status: "published",
      slides: demoSlides,
      scheduledDate: "2026-09-15",
      concurrencyVersion: 1,
    },
    ...[3, 4, 5, 9].map((n) => ({
      id: `lesson.grade8.${n}`,
      title: `${n}. óra: Pitagorasz műhely`,
      courseId: "course.grade8-math",
      status: "published" as const,
      slides: demoSlides.slice(0, Math.min(6, n)),
      scheduledDate: `2026-09-${String(13 + n).padStart(2, "0")}`,
      concurrencyVersion: 1,
    })),
  ];
  const state: WorkspaceState = {
    version: 1,
    users: [
      {
        id: "user.demo-admin",
        email: "admin@fonat.local",
        displayName: "Demo Tanár",
        passwordHash,
        roles: ["admin", "teacher"],
        disabled: false,
        temporaryPassword: false,
      },
    ],
    sessions: [],
    subjects: [
      entity("subject.math", "Matematika"),
      entity("subject.informatics", "Informatika"),
    ],
    learnerGroups: [
      entity("group.grade8", "8. a", { schoolYear: "2026/27" }),
      entity("group.grade11", "11. csillag", { schoolYear: "2026/27" }),
    ],
    learners: learners.map(([lid, name, icon, note], i) =>
      entity(lid!, name!, {
        displayPseudonym: name,
        badge: { icon, colorToken: `badge-${i + 1}`, textLabel: note },
        administrativeIdentity: {},
      }),
    ),
    enrollments: learners.map(([lid], i) =>
      entity(`enrollment.${i + 1}`, `Beiratkozás ${i + 1}`, {
        learnerId: lid,
        learnerGroupId: "group.grade8",
        status: "active",
        startDate: "2026-09-01",
      }),
    ),
    courses: [
      entity("course.grade8-math", "8. osztály matematika", {
        subjectId: "subject.math",
        learnerGroupIds: ["group.grade8"],
        defaultLocationId: "location.math-room",
        timezone: "Europe/Budapest",
      }),
      entity("course.grade11-probability", "11. osztály valószínűség", {
        subjectId: "subject.math",
        learnerGroupIds: ["group.grade11"],
        defaultLocationId: "location.lab",
        timezone: "Europe/Budapest",
      }),
    ],
    locations: [
      entity("location.math-room", "Matematika terem", { room: "M12" }),
      entity("location.lab", "Informatika labor", { room: "I03" }),
    ],
    nodes: concepts.concat([
      entity(
        "resource.right-triangle-vocabulary",
        "Derékszögű háromszög szókincse",
        {
          type: "resource",
          lifecycle: "published",
          markdown:
            "A **befogók** közrezárják a derékszöget; az **átfogó** vele szemközt van.",
        },
      ),
      entity("resource.pythagorean-visual-proof", "Területi bizonyítás", {
        type: "resource",
        lifecycle: "published",
        markdown:
          "A két kisebb négyzet területének összege megegyezik a nagyobbéval.",
      }),
      entity(
        "resource.wolfram-pythagorean-exploration",
        "WolframAlpha felfedezés",
        {
          type: "resource",
          provider: "wolframalpha",
          url: "https://www.wolframalpha.com/input?i=pythagorean+theorem",
        },
      ),
    ]),
    relations: [
      entity("relation.sqrt-requires-square", "Négyzetgyök előfeltétel", {
        type: "requires",
        sourceId: "concept.3",
        targetId: "concept.1",
      }),
      entity("relation.pythagorean-requires-right", "Tétel előfeltétele", {
        type: "requires",
        sourceId: "concept.13",
        targetId: "concept.9",
      }),
    ],
    collections: [entity("collection.grade8", "Pitagorasz gyűjtemény")],
    annualPlans: [
      entity("plan.grade8", "8. matematika éves terv", {
        courseId: "course.grade8-math",
        status: "draft",
      }),
    ],
    phases: Array.from({ length: 12 }, (_, i) =>
      entity(`phase.${i + 1}`, `${i + 1}. tanulási szakasz`, {
        annualPlanId: "plan.grade8",
        order: i + 1,
      }),
    ),
    lessons,
    exercises,
    lessonRuns: [
      {
        id: "run.completed.1",
        lessonId: "lesson.grade8.4",
        state: "completed",
        currentSlideIndex: 5,
        startedAt: "2026-09-12T08:00:00.000Z",
        completedAt: "2026-09-12T08:45:00.000Z",
      },
    ],
    liveSessions: [],
    participants: [],
    liveAnswers: [],
    assignments: [
      entity("assignment.hypotenuse", "Átfogó gyakorlás", {
        courseId: "course.grade8-math",
        status: "assigned",
        exerciseIds: [
          "exercise.missing-hypotenuse-6-8",
          "exercise.rectangle-diagonal",
        ],
        deadlineDate: "2026-09-18",
      }),
      entity("assignment.correction", "Hiányzó befogó javítás", {
        courseId: "course.grade8-math",
        status: "assigned",
        exerciseIds: ["exercise.missing-leg-13-5"],
        deadlineDate: "2026-09-20",
      }),
    ],
    drafts: [],
    submissions: [],
    evidence: [
      entity("evidence.hedgehog", "Sün fejlődése", {
        learnerId: "learner.hedgehog",
        conceptId: "concept.15",
        level: "improving",
        note: "Vizuális támasz után önállóan javított.",
      }),
    ],
    grades: [],
    assessmentBlueprints: [
      entity("blueprint.closing", "Pitagorasz záró felmérés", {
        courseId: "course.grade8-math",
        slots: [
          { id: "slot1", conceptId: "concept.14", points: 2 },
          { id: "slot2", conceptId: "concept.15", points: 3 },
          { id: "slot3", conceptId: "concept.16", points: 3 },
          { id: "slot4", conceptId: "concept.20", points: 4 },
          { id: "slot5", conceptId: "concept.17", points: 3 },
          { id: "slot6", conceptId: "concept.13", points: 5 },
        ],
      }),
    ],
    assessments: [],
    assessmentDeliveries: [],
    findings: [
      entity("finding.sqrt", "Gyenge négyzetgyök előfeltétel", {
        severity: "warning",
        conceptId: "concept.3",
      }),
      entity("finding.distractor", "Vonzó hibás kivonási lépés", {
        severity: "info",
        exerciseId: "exercise.missing-leg-common-mistake",
      }),
    ],
    projects: [
      entity("project.mushroom-yard", "Szökés a gombakertből", {
        status: "draft",
        summary:
          "Erdőlakó csapat bináris, mintázat- és törtkihívásokon át keresi a kijáratot.",
        subjects: ["subject.math", "subject.informatics"],
        challenges: [
          "A szentjánosbogarak 1011 üzenete",
          "Gombakalap-mintázatok",
          "A mogyorók háromnegyede",
        ],
        contributors: ["Hiányzó hangkulissza", "Alternatív bináris feladat"],
      }),
    ],
    features: { projects: true },
    audit: [
      entity("audit.seed", "Demo csomag betöltve", { at: nowIso(clock) }),
    ],
  };
  return state;
}

export const allowedRunTransition = (
  from: LessonRun["state"],
  to: LessonRun["state"],
): boolean =>
  (
    ({
      active: ["paused", "completed", "abandoned"],
      paused: ["active", "completed", "abandoned"],
      completed: [],
      abandoned: [],
    })[from] as string[]
  ).includes(to);

export function gradeExercise(
  exercise: Exercise,
  answer: unknown,
): boolean | undefined {
  if (exercise.exerciseType === "manual-response") return undefined;
  if (exercise.exerciseType === "boolean")
    return answer === exercise.correctValue;
  if (exercise.exerciseType === "numeric") {
    const n = Number(answer);
    return (
      Number.isFinite(n) &&
      Math.abs(n - (exercise.expectedValue ?? 0)) <=
        (exercise.absoluteTolerance ?? 0)
    );
  }
  if (
    exercise.exerciseType === "single-choice" ||
    exercise.exerciseType === "multiple-choice"
  ) {
    const got = Array.isArray(answer)
      ? answer.map(String).sort()
      : [String(answer)].sort();
    const want = (exercise.correctOptionIds ?? []).slice().sort();
    return JSON.stringify(got) === JSON.stringify(want);
  }
  if (exercise.exerciseType === "accepted-text") {
    const value = String(answer);
    const normalize = (v: string) =>
      exercise.normalization === "exact" ? v : v.trim().toLocaleLowerCase("hu");
    return (exercise.acceptedVariants ?? []).some(
      (v) => normalize(v) === normalize(value),
    );
  }
  return false;
}

export async function authenticate(
  state: WorkspaceState,
  email: string,
  password: string,
  clock: Clock,
): Promise<Result<{ user: Omit<User, "passwordHash">; session: Session }>> {
  const user = state.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (
    !user ||
    user.disabled ||
    !(await bcrypt.compare(password, user.passwordHash))
  )
    return err("AUTH_INVALID", "auth.invalidCredentials");
  const session = {
    id: id("session"),
    userId: user.id,
    expiresAt: new Date(
      clock.now().getTime() + 8 * 60 * 60 * 1000,
    ).toISOString(),
  };
  state.sessions.push(session);
  const { passwordHash, ...safe } = user;
  return ok({ user: safe, session });
}
