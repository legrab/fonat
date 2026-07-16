import gettingStarted from "./hu/getting-started.md?raw";
import terminology from "./hu/terminology.md?raw";
import createMaterials from "./hu/create-materials.md?raw";
import createExercises from "./hu/create-exercises.md?raw";
import buildALesson from "./hu/build-a-lesson.md?raw";
import liveSession from "./hu/live-session.md?raw";
import assignAndReview from "./hu/assign-and-review.md?raw";
import createAnAssessment from "./hu/create-an-assessment.md?raw";
import revisionsAndHistory from "./hu/revisions-and-history.md?raw";
import troubleshooting from "./hu/troubleshooting.md?raw";
import teacherTips from "./hu/teacher-tips.md?raw";

export type ManualCategory =
  "Első lépések" | "Fogalmak" | "Útmutatók" | "Hibaelhárítás" | "Tippek";

export type ManualArticle = {
  slug: string;
  title: string;
  summary: string;
  category: ManualCategory;
  keywords: string[];
  body: string;
  related: string[];
};

export const manualArticles: ManualArticle[] = [
  {
    slug: "getting-started",
    title: "Első lépések",
    summary: "Az első kurzus és tanítási egység létrehozása.",
    category: "Első lépések",
    keywords: ["beállítás", "kurzus", "csoport", "első óra"],
    body: gettingStarted,
    related: ["terminology", "create-materials", "build-a-lesson"],
  },
  {
    slug: "terminology",
    title: "Fonat fogalomtár",
    summary: "A teljes tanári és domain szókészlet példákkal.",
    category: "Fogalmak",
    keywords: ["fogalom", "szótár", "terminológia", "jelentés"],
    body: terminology,
    related: ["getting-started", "revisions-and-history"],
  },
  {
    slug: "create-materials",
    title: "Fogalom és tananyag létrehozása",
    summary: "Markdown tartalom, előnézet és kapcsolatok.",
    category: "Útmutatók",
    keywords: ["könyvtár", "fogalom", "tananyag", "kapcsolat"],
    body: createMaterials,
    related: ["create-exercises", "terminology"],
  },
  {
    slug: "create-exercises",
    title: "Gyakorlófeladat készítése",
    summary: "A hat támogatott feladattípus helyes beállítása.",
    category: "Útmutatók",
    keywords: ["gyakorlófeladat", "tolerancia", "választás", "rubrika"],
    body: createExercises,
    related: ["create-materials", "build-a-lesson", "assign-and-review"],
  },
  {
    slug: "build-a-lesson",
    title: "Óraterv összeállítása",
    summary: "Tevékenységek, diagnosztika és biztonságos bemutatás.",
    category: "Útmutatók",
    keywords: ["óraterv", "bemutatás", "dia", "tevékenység"],
    body: buildALesson,
    related: ["live-session", "create-exercises", "teacher-tips"],
  },
  {
    slug: "live-session",
    title: "Élő kérdés használata",
    summary: "Csatlakozás, válaszállapot, felfedés és adatvédelem.",
    category: "Útmutatók",
    keywords: ["élő", "kód", "válasz", "felfedés", "rangsor"],
    body: liveSession,
    related: ["build-a-lesson", "troubleshooting"],
  },
  {
    slug: "assign-and-review",
    title: "Kiosztás és javítás",
    summary: "Piszkozat, beadás, visszaküldés és elfogadás.",
    category: "Útmutatók",
    keywords: ["kiosztás", "beadás", "javítás", "visszajelzés"],
    body: assignAndReview,
    related: ["create-exercises", "revisions-and-history"],
  },
  {
    slug: "create-an-assessment",
    title: "Felmérés készítése",
    summary: "Követelményhelyek, hiány, A/B kézbesítés és értékelés.",
    category: "Útmutatók",
    keywords: ["felmérés", "sablon", "A/B", "kézbesítés", "értékelés"],
    body: createAnAssessment,
    related: ["create-exercises", "revisions-and-history"],
  },
  {
    slug: "revisions-and-history",
    title: "Revíziók és előzmények",
    summary: "Mi változhat és mi marad megváltoztathatatlan.",
    category: "Fogalmak",
    keywords: ["revízió", "pillanatkép", "ütközés", "előzmény"],
    body: revisionsAndHistory,
    related: ["terminology", "troubleshooting"],
  },
  {
    slug: "troubleshooting",
    title: "Hibaelhárítás",
    summary: "Közzétételi, mentési, munkamenet- és élőóra-hibák.",
    category: "Hibaelhárítás",
    keywords: ["hiba", "ütközés", "munkamenet", "nem találom"],
    body: troubleshooting,
    related: ["getting-started", "revisions-and-history", "live-session"],
  },
  {
    slug: "teacher-tips",
    title: "Tanári tippek",
    summary: "Tömör pedagógiai és biztonságos használati tanácsok.",
    category: "Tippek",
    keywords: ["tipp", "módszertan", "javítás", "biztonság"],
    body: teacherTips,
    related: ["build-a-lesson", "assign-and-review", "create-an-assessment"],
  },
];

export const manualCategories: ManualCategory[] = [
  "Első lépések",
  "Fogalmak",
  "Útmutatók",
  "Hibaelhárítás",
  "Tippek",
];
