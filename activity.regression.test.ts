import { describe, expect, it } from "vitest";
import { activitySubmissionInput } from "./classroom";
import { getActivityQuestions, gradeActivity } from "../shared/varietyData";
import { textbookLevels } from "../shared/gameData";
import { readFileSync } from "node:fs";

describe("reviewed curriculum and activity regressions", () => {
  it("accepts the long source-backed daily question ID", () => {
    const questions = getActivityQuestions("daily", "4B", "2027-01-15");
    expect(questions[0].id.length).toBeGreaterThan(120);
    expect(
      activitySubmissionInput.safeParse({
        game: "daily",
        level: "4B",
        questionIds: questions.map(q => q.id),
        answers: questions.map(q => q.answer),
      }).success
    ).toBe(true);
  });
  it("does not mark a second valid 1A scrapbook sentence wrong", () => {
    const questions = getActivityQuestions("story", "1A");
    for (const q of questions) {
      expect(
        q.options
          .filter((_, i) => i !== q.answer)
          .every(
            option => option.includes(" are ") || option.includes("The words")
          )
      ).toBe(true);
      expect(
        q.options
          .filter((_, i) => i !== q.answer)
          .every(
            option =>
              !/The word [“‘'][^”’']+[”’'] is on my card today/.test(option)
          )
      ).toBe(true);
    }
    expect(
      gradeActivity({
        game: "story",
        level: "1A",
        questionIds: questions.map(q => q.id),
        answers: questions.map(q => q.answer),
      }).correct
    ).toBe(5);
  });
  it.each(textbookLevels)(
    "%s auction uses authored errors, not valid tense alternatives",
    level => {
      const q = getActivityQuestions("auction", level);
      const incorrect = q.filter(question => question.answer === 1);
      expect(incorrect).toHaveLength(2);
      expect(
        incorrect.every(question => question.explanation.startsWith("Repair:"))
      ).toBe(true);
      expect(
        incorrect.every(
          question =>
            question.question !== "Lily and I went to school on foot every day."
        )
      ).toBe(true);
    }
  );
  it("provides a reachable curriculum navigation action", () => {
    const home = readFileSync(
      new URL("../client/src/pages/Home.tsx", import.meta.url),
      "utf8"
    );
    expect(home).toContain('onClick={() => navigate("/curriculum")}');
    expect(home).toContain("<span>Our curriculum</span>");
  });
});
