import { describe, expect, it } from "vitest";
import {
  allowedRunTransition,
  createDemoState,
  FixedClock,
  gradeExercise,
} from "@fonat/application";
describe("application foundations", () => {
  it("seeds the required exercise breadth", async () => {
    const state = await createDemoState(new FixedClock());
    expect(new Set(state.exercises.map((x) => x.exerciseType)).size).toBe(6);
    expect(state.exercises).toHaveLength(18);
    expect(state.nodes.filter((n: any) => n.type === "concept")).toHaveLength(
      24,
    );
    expect(
      state.lessons
        .find((x) => x.id === "lesson.demo-presentation")
        ?.slides.map((x) => x.type),
    ).toEqual([
      "section-intro",
      "concept",
      "visual",
      "task",
      "live-quiz",
      "response-status",
      "results",
      "solution",
      "timer",
      "homework",
    ]);
  });
  it("guards lesson run transitions", () => {
    expect(allowedRunTransition("active", "paused")).toBe(true);
    expect(allowedRunTransition("completed", "active")).toBe(false);
  });
  it("grades numeric tolerance and accepted text", async () => {
    const state = await createDemoState();
    expect(
      gradeExercise(
        state.exercises.find(
          (x) => x.id === "exercise.missing-hypotenuse-decimal",
        )!,
        6.62,
      ),
    ).toBe(true);
    expect(
      gradeExercise(
        state.exercises.find((x) => x.id === "exercise.exit-ticket")!,
        "Derékszögű háromszögben",
      ),
    ).toBe(true);
  });
});
