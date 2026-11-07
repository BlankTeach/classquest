import { curriculumWords, grammarTargets } from "./curriculum";
import { describe, expect, it } from "vitest";
import {
  calculatePoints,
  gradeSubmission,
  grammarTopics,
  memoryLevels,
  quizQuestions,
  sortLevels,
  textbookLevels,
} from "./gameData";

type Submission = Parameters<typeof gradeSubmission>[0];
const gradeRaw = (input: unknown) => gradeSubmission(input as Submission);
const questions = quizQuestions.slice(0, 5);
const quiz = (): Submission => ({
  game: "quiz",
  questionIds: questions.map(question => question.id),
  answers: questions.map(question => question.answer),
});
const sorted = (): Submission => ({
  game: "sort",
  levelId: sortLevels[0].id,
  assignments: sortLevels[0].words.map(word => word.basket),
});
const matches = (): [number, number][] =>
  Array.from({ length: 8 }, (_, index) => [index, index + 8]);
const remembered = (attempts = matches()): Submission => ({
  game: "memory",
  levelId: memoryLevels[0].id,
  attempts,
});

describe("exact point tiers", () => {
  it.each([
    [5, 5, 5],
    [8, 8, 5],
    [4, 5, 3],
    [2, 5, 3],
    [7, 8, 3],
    [1, 5, 1],
    [0, 5, 1],
    [1, 8, 1],
    [0, 8, 1],
    [1, 1, 5],
    [0, 1, 1],
    [2, 2, 5],
  ])("%i of %i awards +%i", (correct, total, expected) => {
    expect(calculatePoints(correct, total)).toBe(expected);
  });
  it.each([
    [-1, 5],
    [6, 5],
    [0, 0],
    [1, -1],
    [1.5, 5],
    [1, 5.5],
    [NaN, 5],
    [1, Infinity],
    [Infinity, Infinity],
  ])("rejects invalid score %s / %s", (correct, total) => {
    expect(() => calculatePoints(correct, total)).toThrow("Invalid score");
  });
});

describe("quiz grading", () => {
  it("grades five known answers against the shared answer key", () => {
    expect(gradeSubmission(quiz())).toEqual({ correct: 5, total: 5 });
  });
  it("returns a partial score rather than trusting a client score", () => {
    const submission = quiz();
    submission.answers![0] =
      (questions[0].answer + 1) % questions[0].options.length;
    submission.answers![4] =
      (questions[4].answer + 1) % questions[4].options.length;
    expect(gradeRaw({ ...submission, correct: 5, points: 999 })).toEqual({
      correct: 3,
      total: 5,
    });
  });
  it("accepts any five distinct known questions, including vocabulary", () => {
    const chosen = quizQuestions
      .filter(question => question.mode === "vocabulary")
      .slice(-5);
    expect(
      gradeSubmission({
        game: "quiz",
        questionIds: chosen.map(question => question.id),
        answers: chosen.map(question => question.answer),
      })
    ).toEqual({ correct: 5, total: 5 });
  });
  it.each([
    {},
    { game: "quiz" },
    { ...quiz(), questionIds: [] },
    { ...quiz(), answers: [0] },
    {
      ...quiz(),
      questionIds: [...questions.map(question => question.id), "extra"],
    },
    { ...quiz(), answers: [...questions.map(question => question.answer), 0] },
    { ...quiz(), questionIds: Array(5).fill(questions[0].id) },
    {
      ...quiz(),
      questionIds: [
        "unknown",
        ...questions.slice(1).map(question => question.id),
      ],
    },
    {
      ...quiz(),
      questionIds: [null, ...questions.slice(1).map(question => question.id)],
    },
    { ...quiz(), questionIds: Array(5) },
    { ...quiz(), answers: Array(5) },
    { ...quiz(), answers: [-1, 0, 0, 0, 0] },
    { ...quiz(), answers: [4, 0, 0, 0, 0] },
    { ...quiz(), answers: [0.5, 0, 0, 0, 0] },
    { ...quiz(), answers: ["0", 0, 0, 0, 0] },
    { ...quiz(), answers: [NaN, 0, 0, 0, 0] },
    { ...quiz(), answers: [Infinity, 0, 0, 0, 0] },
    { ...quiz(), answers: null },
    { ...quiz(), questionIds: "not an array" },
  ])("rejects malformed quiz %#", input =>
    expect(() => gradeRaw(input)).toThrow("Invalid submission")
  );
});

describe("sorting grading", () => {
  it("grades all eight assignments and calculates partial results", () => {
    expect(gradeSubmission(sorted())).toEqual({ correct: 8, total: 8 });
    const submission = sorted();
    submission.assignments![0] =
      (submission.assignments![0] + 1) % sortLevels[0].baskets.length;
    expect(gradeSubmission(submission)).toEqual({ correct: 7, total: 8 });
  });
  it("accepts a completed but entirely wrong sort", () => {
    const level = sortLevels[0];
    expect(
      gradeSubmission({
        game: "sort",
        levelId: level.id,
        assignments: level.words.map(
          item => (item.basket + 1) % level.baskets.length
        ),
      })
    ).toEqual({ correct: 0, total: 8 });
  });
  it.each([
    { game: "sort" },
    { ...sorted(), levelId: "unknown" },
    { ...sorted(), assignments: [] },
    { ...sorted(), assignments: Array(7).fill(0) },
    { ...sorted(), assignments: Array(9).fill(0) },
    { ...sorted(), assignments: Array(8) },
    { ...sorted(), assignments: Array(8).fill(-1) },
    { ...sorted(), assignments: Array(8).fill(3) },
    { ...sorted(), assignments: Array(8).fill(0.5) },
    { ...sorted(), assignments: Array(8).fill("0") },
    { ...sorted(), assignments: Array(8).fill(null) },
    { ...sorted(), assignments: Array(8).fill(NaN) },
    { ...sorted(), assignments: Array(8).fill(Infinity) },
    { ...sorted(), assignments: null },
    { ...sorted(), levelId: memoryLevels[0].id },
  ])("rejects malformed sort %#", input =>
    expect(() => gradeRaw(input)).toThrow("Invalid submission")
  );
});

describe("chronological memory grading", () => {
  it("awards full marks only for eight clean matches", () => {
    const result = gradeSubmission(remembered());
    expect(result).toEqual({ correct: 8, total: 8 });
    expect(calculatePoints(result.correct, result.total)).toBe(5);
  });
  it("accepts reversed word/meaning order and arbitrary pair completion order", () => {
    const attempts = matches()
      .reverse()
      .map(([first, second]) => [second, first] as [number, number]);
    expect(gradeSubmission(remembered(attempts))).toEqual({
      correct: 8,
      total: 8,
    });
  });
  it("marks BOTH pair IDs dirty after one mismatch, despite matching all cards later", () => {
    const result = gradeSubmission(remembered([[0, 9], ...matches()]));
    expect(result).toEqual({ correct: 6, total: 8 });
    expect(calculatePoints(result.correct, result.total)).toBe(3);
  });
  it("counts a same-side flip as a mismatch", () => {
    expect(gradeSubmission(remembered([[0, 1], ...matches()]))).toEqual({
      correct: 6,
      total: 8,
    });
    expect(gradeSubmission(remembered([[8, 9], ...matches()]))).toEqual({
      correct: 6,
      total: 8,
    });
  });
  it("does not deduct twice for repeated mismatches, but dirties newly involved pairs", () => {
    expect(
      gradeSubmission(remembered([[0, 9], [0, 9], [0, 10], ...matches()]))
    ).toEqual({ correct: 5, total: 8 });
  });
  it("preserves clean matches completed before a later mismatch", () => {
    const attempts: [number, number][] = [
      [7, 15],
      [0, 9],
      ...matches().slice(0, 7),
    ];
    expect(gradeSubmission(remembered(attempts))).toEqual({
      correct: 6,
      total: 8,
    });
  });
  it("can finish with zero correct clean matches, earning only +1", () => {
    const result = gradeSubmission(
      remembered([[0, 9], [2, 11], [4, 13], [6, 15], ...matches()])
    );
    expect(result).toEqual({ correct: 0, total: 8 });
    expect(calculatePoints(result.correct, result.total)).toBe(1);
  });
  it("can finish with exactly one clean match, earning only +1", () => {
    const result = gradeSubmission(
      remembered([[0, 9], [2, 11], [4, 13], [5, 14], ...matches()])
    );
    expect(result).toEqual({ correct: 1, total: 8 });
    expect(calculatePoints(result.correct, result.total)).toBe(1);
  });
  it.each([
    { game: "memory" },
    { ...remembered(), levelId: "unknown" },
    { ...remembered(), levelId: sortLevels[0].id },
    remembered([]),
    remembered(matches().slice(0, 7)),
    remembered(Array.from({ length: 8 }, () => [0, 9] as [number, number])),
    remembered([...matches(), [0, 8]]),
    remembered([[0, 8], [0, 9], ...matches().slice(1)]),
    remembered([[0, 0], ...matches()]),
    remembered([[-1, 8], ...matches()]),
    remembered([[0, 16], ...matches()]),
    remembered([[0.1, 8], ...matches()]),
    remembered([[NaN, 8], ...matches()]),
    remembered([[0, Infinity], ...matches()]),
    { ...remembered(), attempts: [["0", 8], ...matches()] },
    { ...remembered(), attempts: [[0], ...matches()] },
    { ...remembered(), attempts: [[0, 8, 1], ...matches()] },
    { ...remembered(), attempts: [null, ...matches()] },
    { ...remembered(), attempts: [Array(2), ...matches()] },
    { ...remembered(), attempts: Array(8) },
    { ...remembered(), attempts: "not an array" },
    { ...remembered(), attempts: null },
  ])("rejects invalid, incomplete or replayed memory history %#", input =>
    expect(() => gradeRaw(input)).toThrow("Invalid submission")
  );
});

describe("submission shape", () => {
  it.each([
    null,
    undefined,
    false,
    0,
    "quiz",
    [],
    { game: "other" },
    { game: null },
  ])("rejects invalid game object %#", input => {
    expect(() => gradeRaw(input)).toThrow("Invalid submission");
  });
});

describe("active PDF curriculum game content", () => {
  it("retains exactly the three original game kinds and twelve textbook levels", () => {
    expect(textbookLevels).toEqual([
      "1A",
      "1B",
      "2A",
      "2B",
      "3A",
      "3B",
      "4A",
      "4B",
      "5A",
      "5B",
      "6A",
      "6B",
    ]);
  });
  it("has unique stable IDs, valid answer options and explicit source metadata", () => {
    expect(
      quizQuestions.filter(question => question.mode === "grammar").length
    ).toBeGreaterThan(1000);
    expect(
      quizQuestions.filter(question => question.mode === "vocabulary").length
    ).toBeGreaterThan(1100);
    expect(new Set(quizQuestions.map(question => question.id)).size).toBe(
      quizQuestions.length
    );
    for (const question of quizQuestions) {
      expect(question.id).toMatch(/^[a-z0-9-]+$/);
      expect(question.id.startsWith("pdf-")).toBe(true);
      expect(textbookLevels).toContain(question.level);
      expect(question.chapter).toBeGreaterThanOrEqual(1);
      expect(question.chapter).toBeLessThanOrEqual(6);
      expect(question.sourcePage).toBeGreaterThanOrEqual(
        question.mode === "grammar" ? 1 : 5
      );
      expect(question.sourcePage).toBeLessThanOrEqual(
        question.mode === "grammar" ? 4 : 18
      );
      expect(question.question.trim().length).toBeGreaterThan(8);
      expect(question.explanation.trim().length).toBeGreaterThan(8);
      expect(question.question).not.toContain("{name}");
      expect(question.options.length).toBeGreaterThanOrEqual(3);
      expect(question.options.length).toBeLessThanOrEqual(4);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options.every(option => option.trim().length > 0)).toBe(
        true
      );
      expect(Number.isInteger(question.answer)).toBe(true);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(question.options.length);
      if (question.mode === "grammar") {
        expect(grammarTopics).toContain(question.topic);
        expect(grammarTargets).toContainEqual({
          level: question.level,
          chapter: question.chapter,
          topic: question.topic,
          sourcePage: question.sourcePage,
        });
      } else {
        const word = curriculumWords.find(
          word =>
            word.level === question.level &&
            word.chapter === question.chapter &&
            word.category === question.topic &&
            word.word === question.options[question.answer]
        );
        expect(word).toBeDefined();
        expect(word?.sourcePage).toBe(question.sourcePage);
        expect(question.question).toContain(word?.definition);
        expect(
          question.options.every(option =>
            curriculumWords.some(
              word => word.level === question.level && word.word === option
            )
          )
        ).toBe(true);
      }
    }
    expect(new Set(quizQuestions.map(question => question.answer))).toEqual(
      new Set([0, 1, 2, 3])
    );
  });
  it.each(textbookLevels)(
    "%s has five-question pools in both modes for every chapter and all source categories",
    level => {
      const vocabulary = quizQuestions.filter(
        question => question.level === level && question.mode === "vocabulary"
      );
      expect(new Set(vocabulary.map(question => question.topic))).toEqual(
        new Set(
          curriculumWords
            .filter(word => word.level === level)
            .map(word => word.category)
        )
      );
      for (let chapter = 1; chapter <= 6; chapter++)
        for (const mode of ["grammar", "vocabulary"] as const) {
          const pool = quizQuestions.filter(
            question =>
              question.level === level &&
              question.chapter === chapter &&
              question.mode === mode
          );
          expect(pool.length).toBeGreaterThanOrEqual(5);
          expect(
            new Set(pool.map(question => question.question)).size
          ).toBeGreaterThanOrEqual(5);
          const chosen = pool.slice(0, 5);
          expect(
            gradeSubmission({
              game: "quiz",
              questionIds: chosen.map(question => question.id),
              answers: chosen.map(question => question.answer),
            })
          ).toEqual({ correct: 5, total: 5 });
        }
    }
  );
  it.each(grammarTargets)(
    "provides at least five true examples for $level chapter $chapter: $topic",
    target => {
      expect(
        quizQuestions.filter(
          question =>
            question.mode === "grammar" &&
            question.level === target.level &&
            question.chapter === target.chapter &&
            question.topic === target.topic
        ).length
      ).toBeGreaterThanOrEqual(5);
    }
  );
  it("represents every source word as an exact answer rather than a replacement or trimmed noun", () => {
    for (const word of curriculumWords)
      expect(
        quizQuestions.some(
          question =>
            question.mode === "vocabulary" &&
            question.level === word.level &&
            question.chapter === word.chapter &&
            question.topic === word.category &&
            question.options[question.answer] === word.word
        )
      ).toBe(true);
  });
  it("includes topic-specific missing grammar examples rather than merely renaming old questions", () => {
    const textFor = (topic: string) =>
      quizQuestions
        .filter(
          question => question.mode === "grammar" && question.topic === topic
        )
        .map(question =>
          [question.question, ...question.options, question.explanation].join(
            " "
          )
        )
        .join(" ")
        .toLowerCase();
    for (const [topic, expected] of [
      ["Present continuous", ["drawing", "are", "sleeping", "is riding"]],
      ["Going to", ["is", "going to", "base verb"]],
      ["Present perfect", ["has", "visited", "broken", "yet"]],
      ["Past continuous", ["was", "were", "sleeping", "fell"]],
      ["Passive voice", ["are", "was", "watered", "lit"]],
      ["Possessive pronouns", ["mine", "hers", "ours", "yours"]],
      ["Reflexive pronouns", ["myself", "himself", "herself", "ourselves"]],
      [
        "-ed / -ing adjectives",
        ["bored", "excited", "touching", "amazed", "amusing"],
      ],
      ["Already / just / yet", ["already", "just", "yet"]],
      [
        "Always / often / sometimes / seldom / never",
        ["always", "often", "sometimes", "seldom", "never"],
      ],
      ["Either … or / neither … nor", ["either", "or", "neither", "nor"]],
      [
        "First / next / then / after that / finally",
        ["first", "next", "then", "after that", "finally"],
      ],
      [
        "Once upon a time / soon / after a while / at last / suddenly / however / in the end",
        [
          "once upon a time",
          "soon",
          "after a while",
          "at last",
          "suddenly",
          "however",
          "in the end",
        ],
      ],
      [
        "Place prepositions: in / on / under / near / at / to",
        ["in", "on", "under", "near", "at", "to"],
      ],
      [
        "Between / in front of / behind / next to / on my …",
        ["between", "in front of", "behind", "next to", "left"],
      ],
    ] as [string, string[]][])
      for (const word of expected) expect(textFor(topic)).toContain(word);
  });
  it("has at least twelve sort and memory levels with all textbooks and versioned source IDs", () => {
    expect(sortLevels.length).toBeGreaterThanOrEqual(12);
    expect(memoryLevels.length).toBeGreaterThanOrEqual(12);
    expect(sortLevels.slice(0, 12).map(level => level.level)).toEqual(
      textbookLevels
    );
    expect(memoryLevels.slice(0, 12).map(level => level.level)).toEqual(
      textbookLevels
    );
    expect(new Set(sortLevels.map(level => level.id)).size).toBe(
      sortLevels.length
    );
    expect(new Set(memoryLevels.map(level => level.id)).size).toBe(
      memoryLevels.length
    );
    expect(sortLevels.every(level => level.id.includes("-pdf"))).toBe(true);
    expect(memoryLevels.every(level => level.id.includes("-pdf"))).toBe(true);
  });
  it.each(sortLevels)(
    "$id uses eight source words in their real populated category baskets",
    level => {
      expect(level.words).toHaveLength(8);
      expect(level.baskets.length).toBeGreaterThanOrEqual(2);
      expect(level.baskets.length).toBeLessThanOrEqual(3);
      expect(new Set(level.words.map(item => item.word)).size).toBe(8);
      for (const item of level.words) {
        const entry = curriculumWords.find(
          word =>
            word.level === level.level &&
            word.word === item.word &&
            word.category === level.baskets[item.basket] &&
            (level.chapter === undefined || word.chapter === level.chapter)
        );
        expect(entry).toBeDefined();
        if (level.sourcePage !== undefined)
          expect(entry?.sourcePage).toBe(level.sourcePage);
      }
      for (let basket = 0; basket < level.baskets.length; basket++)
        expect(
          level.words.filter(item => item.basket === basket).length
        ).toBeGreaterThanOrEqual(2);
      expect(
        gradeSubmission({
          game: "sort",
          levelId: level.id,
          assignments: level.words.map(item => item.basket),
        })
      ).toEqual({ correct: 8, total: 8 });
    }
  );
  it.each(memoryLevels)(
    "$id has unambiguous source-backed pairs and correct dynamic card grading",
    level => {
      // Source-only chapter sets can have fewer than eight words (1A ch1 has four).
      expect(level.pairs.length).toBeGreaterThanOrEqual(4);
      expect(level.pairs.length).toBeLessThanOrEqual(8);
      expect(new Set(level.pairs.map(pair => pair.word)).size).toBe(
        level.pairs.length
      );
      expect(new Set(level.pairs.map(pair => pair.meaning)).size).toBe(
        level.pairs.length
      );
      for (const pair of level.pairs) {
        const entry = curriculumWords.find(
          word =>
            word.level === level.level &&
            word.word === pair.word &&
            word.definition === pair.meaning &&
            (level.chapter === undefined || word.chapter === level.chapter)
        );
        expect(entry).toBeDefined();
        if (level.sourcePage !== undefined)
          expect(entry?.sourcePage).toBe(level.sourcePage);
      }
      const n = level.pairs.length;
      expect(
        gradeSubmission({
          game: "memory",
          levelId: level.id,
          attempts: Array.from({ length: n }, (_, i) => [i, i + n]),
        })
      ).toEqual({ correct: n, total: n });
      if (level.chapter === undefined)
        expect(
          new Set(
            level.pairs.map(
              pair =>
                curriculumWords.find(
                  word => word.level === level.level && word.word === pair.word
                )?.category
            )
          ).size
        ).toBeGreaterThanOrEqual(4);
    }
  );
});

describe("private legacy answer-key compatibility", () => {
  const legacyGrammar = [
    ["g-simple-present-1a-1a3bg9w", 0],
    ["g-simple-present-1b-ujkmtt", 1],
    ["g-simple-present-2a-1vxesg5", 2],
    ["g-simple-present-2b-1lq81q3", 2],
    ["g-simple-present-3a-1cwdj5o", 2],
  ] as const;
  const retiredVocabulary = [
    ["v-1b-home-activities-and-places-watch-tv", 3],
    ["v-2a-places-at-school-canteen", 2],
    ["v-2a-things-we-must-and-must-not-do-queue-up", 2],
    ["v-6a-jobs-and-duties-paramedic", 2],
    ["v-6b-natural-features-and-landmarks-waterfall", 3],
  ] as const;
  it.each([{ fixture: legacyGrammar }, { fixture: retiredVocabulary }])(
    "accepts the former IDs and their unchanged option ordering %#",
    ({ fixture }) => {
      expect(
        fixture.every(
          ([id]) => !quizQuestions.some(question => question.id === id)
        )
      ).toBe(true);
      expect(
        gradeSubmission({
          game: "quiz",
          questionIds: fixture.map(([id]) => id),
          answers: fixture.map(([, answer]) => answer),
        })
      ).toEqual({ correct: 5, total: 5 });
      const answers = fixture.map(([, answer]) => answer as number);
      answers[0] = (answers[0] + 1) % 3;
      expect(
        gradeSubmission({
          game: "quiz",
          questionIds: fixture.map(([id]) => id),
          answers,
        })
      ).toEqual({ correct: 4, total: 5 });
    }
  );
  it.each(textbookLevels)(
    "grades %s original sort and memory IDs against the old eight-item orders",
    level => {
      const suffix = level.toLowerCase();
      expect(
        gradeSubmission({
          game: "sort",
          levelId: `sort-${suffix}`,
          assignments:
            level === "4B"
              ? [0, 1, 0, 1, 0, 1, 0, 1]
              : [0, 1, 2, 0, 1, 2, 0, 1],
        })
      ).toEqual({ correct: 8, total: 8 });
      expect(
        gradeSubmission({
          game: "memory",
          levelId: `memory-${suffix}`,
          attempts: matches(),
        })
      ).toEqual({ correct: 8, total: 8 });
      expect(
        gradeSubmission({
          game: "memory",
          levelId: `memory-${suffix}`,
          attempts: [[0, 9], ...matches()],
        })
      ).toEqual({ correct: 6, total: 8 });
      expect(sortLevels.some(set => set.id === `sort-${suffix}`)).toBe(false);
      expect(memoryLevels.some(set => set.id === `memory-${suffix}`)).toBe(
        false
      );
    }
  );
});
