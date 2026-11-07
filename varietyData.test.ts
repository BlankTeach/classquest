import { describe, expect, it } from "vitest";
import { curriculumWords } from "./curriculum";
import { calculatePoints, textbookLevels } from "./gameData";
import {
  activityCatalog,
  getActivityQuestions,
  gradeActivity,
  hasBingo,
} from "./varietyData";
import type { ActivityKind, ActivitySubmission } from "./varietyData";

const day = "2026-11-06";
const questions = (game: ActivityKind, level = "5A", date = day) =>
  getActivityQuestions(game, level, date);
const raw = (input: unknown, date = day) =>
  gradeActivity(input as ActivitySubmission, date);
function submission(game: ActivityKind, level = "5A"): ActivitySubmission {
  const pool = questions(game, level);
  const set = game === "bingo" ? pool.slice(0, 4) : pool;
  const result: ActivitySubmission = {
    game,
    level,
    questionIds: set.map(question => question.id),
  };
  if (game === "builder")
    result.orders = set.map(question => [...question.correctOrder!]);
  else if (game === "charades") result.moderated = Array(set.length).fill(true);
  else result.answers = set.map(question => question.answer);
  if (game === "fix")
    result.textAnswers = set.map(question => question.correction!);
  if (game === "auction" || game === "battle") {
    result.teamNames = ["Forest Stars", "Bright Sparks"];
    result.teamAssignments = set.map((_, index) => index % 2);
  }
  if (game === "auction") result.bets = Array(5).fill(3);
  return result;
}
const wrongAnswers = (
  game: ActivityKind,
  value: ActivitySubmission,
  indices: number[]
) => {
  const set = questions(game, value.level);
  for (const index of indices)
    value.answers![index] = (set[index].answer + 1) % set[index].options.length;
  return value;
};

describe("activity catalog and deterministic curriculum-backed sets", () => {
  it("exports the exact twelve activity kinds and Home metadata", () => {
    expect(activityCatalog.map(activity => activity.id)).toEqual([
      "odd",
      "bingo",
      "builder",
      "auction",
      "fix",
      "maze",
      "story",
      "who",
      "charades",
      "battle",
      "daily",
      "boss",
    ]);
    for (const activity of activityCatalog) {
      expect(["Vocabulary", "Grammar", "Classroom", "Daily"]).toContain(
        activity.category
      );
      expect(["lavender", "peach", "mint"]).toContain(activity.color);
      expect(activity.title.length).toBeGreaterThan(4);
      expect(activity.icon).toBeTruthy();
    }
  });
  it.each(textbookLevels)(
    "%s has a complete deterministic set for every activity",
    level => {
      for (const activity of activityCatalog) {
        const set = questions(activity.id, level);
        expect(set).toHaveLength(
          activity.id === "bingo" ? 9 : activity.id === "daily" ? 1 : 5
        );
        expect(new Set(set.map(question => question.id)).size).toBe(set.length);
        expect(questions(activity.id, level)).toEqual(set);
        for (const question of set) {
          expect(question.question.length).toBeGreaterThan(8);
          expect(question.explanation.length).toBeGreaterThan(10);
          expect(
            question.options.every(
              option => typeof option === "string" && option.length > 0
            )
          ).toBe(true);
          if (activity.id === "builder") {
            expect(question.words).toHaveLength(5);
            expect(new Set(question.correctOrder).size).toBe(5);
            expect(
              question.correctOrder!.every(index => index >= 0 && index < 5)
            ).toBe(true);
          } else expect(question.answer).toBeLessThan(question.options.length);
        }
      }
    }
  );
  it.each(textbookLevels)(
    "%s gives an honest full score on every completed activity",
    level => {
      for (const activity of activityCatalog) {
        const answer = submission(activity.id, level);
        const graded = gradeActivity(answer, day);
        expect(graded.correct).toBe(graded.total);
        expect(graded.total).toBe(
          activity.id === "daily" ? 1 : activity.id === "bingo" ? 4 : 5
        );
        expect(graded.streak).toBe(activity.id !== "daily");
      }
    }
  );
  it.each(textbookLevels)(
    "%s bingo has nine unique source IDs and one fixed word board",
    level => {
      const set = questions("bingo", level);
      expect(new Set(set.map(question => question.id)).size).toBe(9);
      expect(new Set(set[0].options).size).toBe(9);
      expect(new Set(set.map(question => question.answer)).size).toBe(9);
      for (const question of set) {
        expect(question.options).toEqual(set[0].options);
        expect(
          curriculumWords.some(
            word =>
              question.id === `bingo-${word.id}` &&
              word.level === level &&
              word.word === question.options[question.answer]
          )
        ).toBe(true);
      }
    }
  );
  it.each(textbookLevels)(
    "%s charades only uses actual physical-action vocabulary",
    level => {
      for (const question of questions("charades", level)) {
        const word = curriculumWords.find(
          word => question.id === `charades-${word.id}`
        )!;
        expect(word).toBeDefined();
        expect(word.level).toBe(level);
        expect(word.category).not.toMatch(
          /illness|injur|material|adjectiv|disaster|pollution|clothing/i
        );
        expect(question.options).toEqual([word.word]);
      }
    }
  );
  it("Who Am I includes truthful clues and optional yes/no questions", () => {
    for (const question of questions("who")) {
      expect(question.clues).toHaveLength(3);
      expect(question.yesNo).toHaveLength(3);
      expect(question.yesNo![0].answer).toBe(true);
      expect(question.yesNo![1].answer).toBe(false);
      expect(question.yesNo![2].answer).toBe(
        question.options[question.answer].split(/\s+/).length > 1
      );
    }
  });
});

describe("strict submission shape and authoritative IDs", () => {
  it.each([
    null,
    undefined,
    false,
    7,
    "odd",
    [],
    {},
    { game: "not-a-game", level: "5A" },
    { ...submission("odd"), level: "9C" },
    { ...submission("odd"), level: 5 },
  ])("rejects malformed activity %#", value =>
    expect(() => raw(value)).toThrow("Invalid submission")
  );
  it.each(activityCatalog.map(activity => activity.id))(
    "%s rejects unknown, duplicate, reordered, cross-level and incomplete question IDs",
    game => {
      const answer = submission(game);
      for (const ids of [
        [],
        answer.questionIds!.slice(0, -1),
        [...answer.questionIds!, "extra"],
        ...(answer.questionIds!.length > 1
          ? [Array(answer.questionIds!.length).fill(answer.questionIds![0])]
          : []),
        ["unknown", ...answer.questionIds!.slice(1)],
        [null, ...answer.questionIds!.slice(1)],
        Array(answer.questionIds!.length),
      ]) {
        expect(() => raw({ ...answer, questionIds: ids })).toThrow(
          "Invalid submission"
        );
      }
      if (game !== "daily")
        expect(() =>
          raw({ ...answer, questionIds: [...answer.questionIds!].reverse() })
        ).toThrow("Invalid submission");
      expect(() =>
        raw({ ...answer, questionIds: submission(game, "1A").questionIds })
      ).toThrow("Invalid submission");
    }
  );
  it.each([
    "odd",
    "maze",
    "story",
    "who",
    "auction",
    "battle",
    "daily",
    "boss",
  ] as ActivityKind[])(
    "%s rejects invalid option indices and answer counts",
    game => {
      const answer = submission(game);
      for (const value of [
        -1,
        999,
        0.25,
        NaN,
        Infinity,
        "0",
        null,
        undefined,
      ]) {
        expect(() =>
          raw({ ...answer, answers: [value, ...answer.answers!.slice(1)] })
        ).toThrow("Invalid submission");
      }
      for (const values of [
        [],
        Array(answer.answers!.length),
        [...answer.answers!, 0],
        null,
        "not-array",
      ])
        expect(() => raw({ ...answer, answers: values })).toThrow(
          "Invalid submission"
        );
    }
  );
  it("never trusts client scores, points, streaks or team totals", () => {
    const answer = wrongAnswers("odd", submission("odd"), [0, 1, 2, 3, 4]);
    expect(
      raw({
        ...answer,
        correct: 5,
        total: 5,
        points: 999,
        streak: true,
        teamScores: [{ name: "cheat", score: 1000 }],
      })
    ).toEqual({ correct: 0, total: 5, streak: false });
  });
  it("rejects unrelated answer channels instead of trusting moderation or wagers on solo games", () => {
    expect(() =>
      raw({ ...submission("odd"), moderated: Array(5).fill(true) })
    ).toThrow("Invalid submission");
    expect(() =>
      raw({ ...submission("builder"), answers: Array(5).fill(0) })
    ).toThrow("Invalid submission");
    expect(() =>
      raw({ ...submission("charades"), answers: Array(5).fill(0) })
    ).toThrow("Invalid submission");
    expect(() => raw({ ...submission("odd"), bets: Array(5).fill(5) })).toThrow(
      "Invalid submission"
    );
  });
});

describe("sentence order and single-error correction", () => {
  it("grades wrong permutations as wrong without allowing missing or duplicated chunks", () => {
    const answer = submission("builder");
    [answer.orders![0][0], answer.orders![0][1]] = [
      answer.orders![0][1],
      answer.orders![0][0],
    ];
    expect(gradeActivity(answer).correct).toBe(4);
    for (const order of [
      [0, 0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3, 5],
      [0, 1, 2, 3, 0.5],
      [0, 1, 2, 3, "4"],
      Array(5),
      null,
    ])
      expect(() =>
        raw({
          ...submission("builder"),
          orders: [order, ...submission("builder").orders!.slice(1)],
        })
      ).toThrow("Invalid submission");
  });
  it("requires both the correct error index and normalized correction", () => {
    const answer = submission("fix");
    answer.textAnswers = answer.textAnswers!.map(
      value => `  ${value.toUpperCase()}!!!  `
    );
    expect(gradeActivity(answer).correct).toBe(5);
    answer.textAnswers[0] = "wrong word";
    expect(gradeActivity(answer).correct).toBe(4);
    answer.textAnswers[0] = questions("fix")[0].correction!;
    answer.answers![0] =
      (answer.answers![0] + 1) % questions("fix")[0].options.length;
    expect(gradeActivity(answer).correct).toBe(4);
  });
  it("rejects missing, oversized, numeric or sparse correction strings", () => {
    for (const texts of [
      [],
      null,
      Array(5),
      [5, "a", "b", "c", "d"],
      ["x".repeat(101), "a", "b", "c", "d"],
    ])
      expect(() => raw({ ...submission("fix"), textAnswers: texts })).toThrow(
        "Invalid submission"
      );
  });
  it("maze first answers remain wrong even though the UI permits retries to unblock movement", () => {
    const answer = wrongAnswers("maze", submission("maze"), [0, 1]);
    expect(gradeActivity(answer)).toEqual({
      correct: 3,
      total: 5,
      streak: true,
    });
  });
});

describe("bingo requires a called, correct, completed line", () => {
  it("recognizes rows, columns and diagonals but not any arbitrary three", () => {
    for (const cells of [
      [0, 1, 2],
      [0, 3, 6],
      [0, 4, 8],
      [2, 4, 6],
    ])
      expect(hasBingo(cells)).toBe(true);
    expect(hasBingo([0, 2, 4])).toBe(false);
    expect(hasBingo([0, 0, 0])).toBe(false);
  });
  it("accepts the first four calls when the second diagonal is complete", () =>
    expect(gradeActivity(submission("bingo"))).toEqual({
      correct: 4,
      total: 4,
      streak: true,
    }));
  it("rejects three correct calls when they do not yet complete a line", () => {
    const answer = submission("bingo");
    expect(() =>
      raw({
        ...answer,
        questionIds: answer.questionIds!.slice(0, 3),
        answers: answer.answers!.slice(0, 3),
      })
    ).toThrow("Invalid submission");
  });
  it("rejects completing with an incorrect cell, uncalled IDs, duplicate marked cells, or extra calls after winning", () => {
    const answer = submission("bingo");
    expect(() => raw({ ...answer, answers: [0, 4, 1, 6] })).toThrow(
      "Invalid submission"
    );
    expect(() =>
      raw({
        ...answer,
        questionIds: [
          ...answer.questionIds!.slice(0, 3),
          questions("bingo")[8].id,
        ],
      })
    ).toThrow("Invalid submission");
    expect(() => raw({ ...answer, answers: [0, 4, 0, 6] })).toThrow(
      "Invalid submission"
    );
    const five = questions("bingo").slice(0, 5);
    expect(() =>
      raw({
        ...answer,
        questionIds: five.map(question => question.id),
        answers: five.map(question => question.answer),
      })
    ).toThrow("Invalid submission");
  });
  it("counts misses honestly when a later first line completes", () => {
    const five = questions("bingo").slice(0, 5);
    const answer = {
      ...submission("bingo"),
      questionIds: five.map(question => question.id),
      answers: [0, 4, 1, 6, 8],
    };
    expect(gradeActivity(answer)).toEqual({
      correct: 4,
      total: 5,
      streak: false,
    });
  });
});

describe("team turns, virtual auction budgets and moderation", () => {
  it("auction returns round net changes, not initial budgets or student deductions", () => {
    const result = gradeActivity(submission("auction"));
    expect(result).toEqual({
      correct: 5,
      total: 5,
      streak: true,
      teamScores: [
        { name: "Forest Stars", score: 9 },
        { name: "Bright Sparks", score: 6 },
      ],
    });
    const allWrong = wrongAnswers(
      "auction",
      submission("auction"),
      [0, 1, 2, 3, 4]
    );
    expect(gradeActivity(allWrong).teamScores).toEqual([
      { name: "Forest Stars", score: -9 },
      { name: "Bright Sparks", score: -6 },
    ]);
    expect(calculatePoints(0, 5)).toBe(1);
  });
  it("battle returns each team's number of correct answers", () => {
    expect(gradeActivity(submission("battle")).teamScores).toEqual([
      { name: "Forest Stars", score: 3 },
      { name: "Bright Sparks", score: 2 },
    ]);
    expect(
      gradeActivity(wrongAnswers("battle", submission("battle"), [0, 3]))
        .teamScores
    ).toEqual([
      { name: "Forest Stars", score: 2 },
      { name: "Bright Sparks", score: 1 },
    ]);
  });
  it("accepts three and four teams with exact turn rotation", () => {
    for (const names of [
      ["A", "B", "C"],
      ["A", "B", "C", "D"],
    ]) {
      const answer = submission("battle");
      answer.teamNames = names;
      answer.teamAssignments = Array.from(
        { length: 5 },
        (_, index) => index % names.length
      );
      expect(
        gradeActivity(answer).teamScores!.reduce(
          (sum, team) => sum + team.score,
          0
        )
      ).toBe(5);
    }
  });
  it.each([
    [],
    ["A"],
    ["A", "B", "C", "D", "E"],
    ["A", " a "],
    [" ", "B"],
    ["x".repeat(41), "B"],
    ["A\n", "B"],
    [null, "B"],
    Array(2),
  ])("rejects invalid team names %#", names =>
    expect(() => raw({ ...submission("battle"), teamNames: names })).toThrow(
      "Invalid submission"
    )
  );
  it.each([
    [],
    Array(5),
    [0, 0, 0, 0, 0],
    [0, 1, 0, 1, 2],
    [0, 1, 0, 1, 0.5],
    ["0", 1, 0, 1, 0],
  ])("rejects invalid/non-rotating assignments %#", assignments =>
    expect(() =>
      raw({ ...submission("auction"), teamAssignments: assignments })
    ).toThrow("Invalid submission")
  );
  it.each([
    [],
    Array(5),
    [0, 1, 1, 1, 1],
    [6, 1, 1, 1, 1],
    [1.5, 1, 1, 1, 1],
    ["1", 1, 1, 1, 1],
    [NaN, 1, 1, 1, 1],
  ])("rejects invalid wagers %#", bets =>
    expect(() => raw({ ...submission("auction"), bets })).toThrow(
      "Invalid submission"
    )
  );
  it("charades grades teacher booleans only; token authorization remains a server responsibility", () => {
    expect(
      gradeActivity({
        ...submission("charades"),
        moderated: [true, false, true, true, true],
      })
    ).toEqual({ correct: 4, total: 5, streak: true });
    for (const judgments of [
      [],
      Array(5),
      [1, 0, 1, 1, 1],
      [true, true, true, true],
      null,
    ])
      expect(() =>
        raw({ ...submission("charades"), moderated: judgments })
      ).toThrow("Invalid submission");
  });
});

describe("daily challenge, boss and streak badge semantics", () => {
  it("selects exactly one authoritative daily question deterministically from the UTC date", () => {
    const first = questions("daily");
    expect(first).toHaveLength(1);
    expect(questions("daily")).toEqual(first);
    expect(questions("daily", "5A", "2026-11-07")[0].id).not.toBe(first[0].id);
    expect(() => gradeActivity(submission("daily"), "2026-11-07")).toThrow(
      "Invalid submission"
    );
    expect(() =>
      raw({ ...submission("daily"), questionIds: [questions("boss")[0].id] })
    ).toThrow("Invalid submission");
  });
  it.each([
    "not-a-date",
    "2026-2-01",
    "2026-02-30",
    "2026-13-01",
    "2026-11-06T00:00:00Z",
  ])("rejects invalid UTC key %s", date =>
    expect(() => questions("daily", "5A", date)).toThrow("Invalid submission")
  );
  it("daily retains a 1-question grade, with double reward applied by the backend", () => {
    const right = gradeActivity(submission("daily"), day);
    const wrong = gradeActivity(
      wrongAnswers("daily", submission("daily"), [0]),
      day
    );
    expect(right).toEqual({ correct: 1, total: 1, streak: false });
    expect(calculatePoints(right.correct, right.total) * 2).toBe(10);
    expect(calculatePoints(wrong.correct, wrong.total) * 2).toBe(2);
  });
  it("three consecutive correct earns a badge without altering standard rewards", () => {
    expect(
      gradeActivity(wrongAnswers("boss", submission("boss"), [0, 4]))
    ).toEqual({ correct: 3, total: 5, streak: true });
    expect(
      gradeActivity(wrongAnswers("boss", submission("boss"), [1, 3]))
    ).toEqual({ correct: 3, total: 5, streak: false });
    expect(calculatePoints(3, 5)).toBe(3);
  });
  it("boss defeat requires all five answers, not just a streak", () => {
    expect(gradeActivity(submission("boss")).correct).toBe(5);
    expect(
      gradeActivity(wrongAnswers("boss", submission("boss"), [4])).correct
    ).toBe(4);
    expect(() =>
      raw({
        ...submission("boss"),
        questionIds: questions("boss")
          .slice(0, 3)
          .map(question => question.id),
        answers: questions("boss")
          .slice(0, 3)
          .map(question => question.answer),
      })
    ).toThrow("Invalid submission");
  });
});
