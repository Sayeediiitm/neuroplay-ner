// app/tests/unit/adaptive.test.ts

import { describe, expect, test } from "vitest";
import { estimateSkill, checkProgress, SkillEstimate } from "../../src/analytics/adaptive";

/** Helper to create metric objects */
function metric(correct: number, incorrect: number, responseTimeMs: number, hintsUsed: boolean) {
  return { correct, incorrect, responseTimeMs, hintsUsed };
}

describe("Adaptive difficulty and progress monitoring", () => {
  test("Improving user: no decline flag", () => {
    const recent = [
      estimateSkill([metric(5, 0, 1500, false), metric(5, 0, 1400, false)]),
    ];
    const baseline = [
      estimateSkill([metric(3, 2, 3000, true), metric(4, 1, 2800, true)]),
    ];
    const flag = checkProgress(recent, baseline);
    expect(flag).toBeNull();
  });

  test("Sustained decline: flag raised", () => {
    const baseline = [
      estimateSkill([metric(5, 0, 1500, false), metric(5, 0, 1400, false), metric(5, 0, 1300, false)]),
    ];
    const recent = [
      estimateSkill([metric(2, 3, 6000, true), metric(1, 4, 6500, true), metric(2, 3, 6200, true)]),
    ];
    const flag = checkProgress(recent, baseline);
    expect(flag).toBe("Worth discussing with a professional.");
  });

  test("Noisy but stable: no flag", () => {
    const baseline = [
      estimateSkill([metric(4, 1, 2000, false), metric(4, 1, 2100, false), metric(4, 1, 1900, false)]),
    ];
    const recent = [
      estimateSkill([metric(3, 2, 3000, true), metric(4, 1, 2100, false), metric(3, 2, 2900, true)]),
    ];
    const flag = checkProgress(recent, baseline);
    expect(flag).toBeNull();
  });

  test("One bad day: no flag", () => {
    const baseline = [
      estimateSkill([metric(4, 1, 2000, false), metric(4, 1, 2100, false), metric(4, 1, 1900, false)]),
    ];
    const recent = [
      estimateSkill([metric(1, 4, 7000, true)]), // single poor session
    ];
    const flag = checkProgress(recent, baseline);
    expect(flag).toBeNull();
  });
});
