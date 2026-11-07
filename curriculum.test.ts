import { describe, expect, it } from "vitest";
import {
  curriculumSource,
  curriculumWords,
  grammarTargets,
} from "./curriculum";
import { textbookLevels } from "./gameData";

const chapterKeys = textbookLevels.flatMap(level =>
  Array.from({ length: 6 }, (_, i) => `${level}-${i + 1}`)
);
const allocations = (topic: string) =>
  grammarTargets
    .filter(target => target.topic === topic)
    .map(target => `${target.level}-${target.chapter}`)
    .sort();
const sourceEntry = (level: string, chapter: number, word: string) =>
  curriculumWords.find(
    entry =>
      entry.level === level && entry.chapter === chapter && entry.word === word
  );

describe("supplied merged.pdf curriculum transcription", () => {
  it("names the local source and covers all 72 textbook chapters", () => {
    expect(curriculumSource).toBe("merged.pdf");
    expect(
      new Set(curriculumWords.map(word => `${word.level}-${word.chapter}`))
    ).toEqual(new Set(chapterKeys));
    expect(
      new Set(grammarTargets.map(target => `${target.level}-${target.chapter}`))
    ).toEqual(new Set(chapterKeys));
    expect(curriculumWords.length).toBeGreaterThanOrEqual(1100);
    expect(grammarTargets).toHaveLength(259);
    expect(new Set(grammarTargets.map(target => target.topic)).size).toBe(117);
    expect(new Set(grammarTargets.map(target => target.sourcePage))).toEqual(
      new Set([1, 2, 3, 4])
    );
    expect(new Set(curriculumWords.map(word => word.sourcePage))).toEqual(
      new Set(Array.from({ length: 14 }, (_, i) => i + 5))
    );
  });
  it("has unique content IDs, useful clues and valid source metadata", () => {
    expect(new Set(curriculumWords.map(word => word.id)).size).toBe(
      curriculumWords.length
    );
    expect(
      new Set(
        curriculumWords.map(
          word => `${word.level}-${word.chapter}-${word.category}-${word.word}`
        )
      ).size
    ).toBe(curriculumWords.length);
    for (const word of curriculumWords) {
      expect(Object.keys(word).sort()).toEqual(
        [
          "id",
          "word",
          "definition",
          "category",
          "level",
          "chapter",
          "sourcePage",
        ].sort()
      );
      expect(word.id).toMatch(/^[a-z0-9-]+$/);
      expect(textbookLevels).toContain(word.level);
      expect(word.chapter).toBeGreaterThanOrEqual(1);
      expect(word.chapter).toBeLessThanOrEqual(6);
      expect(word.word).toBe(word.word.trim());
      expect(word.definition.trim().length).toBeGreaterThan(5);
      expect(word.definition.toLowerCase()).not.toBe(word.word.toLowerCase());
      expect(word.category.trim().length).toBeGreaterThan(0);
      const page = textbookLevels.indexOf(word.level) + 5;
      if (word.level === "6A")
        expect(word.sourcePage).toBe(
          word.chapter === 6
            ? 16
            : word.chapter === 5 && word.category === "Feelings"
              ? 16
              : 15
        );
      else if (word.level === "6B")
        expect(word.sourcePage).toBe(word.chapter >= 5 ? 18 : 17);
      else expect(word.sourcePage).toBe(page);
    }
    expect(
      new Set(
        grammarTargets.map(
          target => `${target.level}-${target.chapter}-${target.topic}`
        )
      ).size
    ).toBe(grammarTargets.length);
    for (const target of grammarTargets) {
      expect(Object.keys(target).sort()).toEqual(
        ["level", "chapter", "topic", "sourcePage"].sort()
      );
      expect(textbookLevels).toContain(target.level);
      expect(target.chapter).toBeGreaterThanOrEqual(1);
      expect(target.chapter).toBeLessThanOrEqual(6);
      expect(
        textbookLevels.indexOf(target.level) < 6 ? [1, 2] : [3, 4]
      ).toContain(target.sourcePage);
    }
  });
  it("retains the entire first textbook list, with articles, colours and the aeroplane alias", () => {
    const expected =
      `brother|mother|father|sister|a class teacher|a student|a friend|a group leader|an English teacher|a classmate|a classroom|a school|a window|a computer|a blackboard|a whiteboard|a door|a desk|a chair|sit|stand|open|close|look|point|a ruler|a school bag|a pen|a pencil|a pencil case|an eraser|a book|a train|a teddy bear|a car|a plane|an aeroplane|a robot|a doll|a ball|a gun|red|orange|yellow|green|blue|purple|pink|white|black|brown|a blouse|a shirt|a skirt|a dress|a T-shirt|a jacket|a hat|shorts|trousers|socks|shoes`.split(
        "|"
      );
    expect(
      curriculumWords.filter(word => word.level === "1A").map(word => word.word)
    ).toEqual(expected);
  });
  it.each([
    ["1B", 2, 6, "feet"],
    ["1B", 5, 6, "laugh"],
    ["1B", 6, 6, "ice-skate"],
    ["2A", 1, 7, "use the computers"],
    ["2A", 2, 7, "wait for your turn"],
    ["2A", 5, 7, "by Light Rail"],
    ["2A", 6, 7, "look after sick people"],
    ["2B", 3, 8, "go to Brownies"],
    ["2B", 4, 8, "have a shower"],
    ["2B", 5, 8, "eat rice dumplings"],
    ["3A", 1, 9, "play Chinese checkers"],
    ["3A", 2, 9, "perform English dramas"],
    ["3A", 6, 9, "have a buffet lunch"],
    ["3B", 3, 10, "sing ‘Happy Birthday’"],
    ["3B", 5, 10, "General Studies"],
    ["3B", 6, 10, "play tricks on"],
    ["4A", 1, 11, "text my friend"],
    ["4A", 3, 11, "a carton of soya milk"],
    ["4A", 5, 11, "use air-cons"],
    ["4A", 6, 11, "do up my buttons"],
    ["4B", 1, 12, "take photos of the harbour"],
    ["4B", 4, 12, "help our muscles grow"],
    ["4B", 6, 12, "tidy my bookshelves"],
    ["5A", 1, 13, "wait impatiently"],
    ["5A", 4, 13, "a woollen cardigan"],
    ["5A", 5, 13, "print out the e-ticket"],
    ["5B", 2, 14, "set up a charity group"],
    ["5B", 3, 14, "staple"],
    ["5B", 6, 14, "set off the alarm"],
    ["6A", 3, 15, "Hurricane signal no. 10"],
    ["6A", 4, 15, "donate canned food"],
    ["6A", 5, 16, "amused"],
    ["6A", 6, 16, "make up (a story)"],
    ["6B", 1, 17, "Ching Ming Festival"],
    ["6B", 2, 17, "a coral reef"],
    ["6B", 4, 17, "a star tortoise"],
    ["6B", 5, 18, "ashamed of"],
    ["6B", 6, 18, "make my own choices"],
  ] as const)(
    "retains source spelling and chapter for %s chapter %i: page %i %s",
    (level, chapter, page, word) => {
      expect(sourceEntry(level, chapter, word)?.sourcePage).toBe(page);
    }
  );
  it("does not silently replace source words with former invented vocabulary", () => {
    const list = new Set(curriculumWords.map(word => word.word));
    for (const word of [
      "canteen",
      "queue up",
      "paramedic",
      "waterfall",
      "poach",
      "tacos",
      "snorkelling",
      "yo-yo",
    ])
      expect(list.has(word)).toBe(false);
  });
  it("uses the exact visible tense column allocations, never inferred earlier introductions", () => {
    expect(allocations("Present continuous")).toEqual(["1B-5", "1B-6"]);
    expect(allocations("Simple present")).toEqual([
      "2A-4",
      "2A-5",
      "2A-6",
      "2B-1",
      "2B-2",
      "2B-3",
      "2B-4",
      "2B-5",
      "2B-6",
      "3A-1",
      "3A-3",
      "3A-4",
      "3B-5",
      "3B-6",
      "4A-1",
      "5B-4",
      "6A-1",
      "6B-1",
    ]);
    expect(allocations("Simple past")).toEqual([
      "3B-1",
      "3B-2",
      "3B-3",
      "3B-4",
      "4A-5",
      "4A-6",
      "5A-6",
      "5B-1",
      "5B-2",
      "5B-5",
      "5B-6",
      "6B-2",
    ]);
    expect(allocations("Future tense")).toEqual(["4B-1", "4B-6", "6A-1"]);
    expect(allocations("Going to")).toEqual(["4B-6"]);
    expect(allocations("Present perfect")).toEqual([
      "5A-5",
      "5A-6",
      "5B-1",
      "5B-2",
    ]);
    expect(allocations("Past continuous")).toEqual(["5B-5", "5B-6"]);
    expect(allocations("Passive voice")).toEqual(["6B-1", "6B-2"]);
    expect(allocations("Indirect speech")).toEqual(["5B-1"]);
  });
  it("preserves the specific pronoun, modal, adjective and connective rows", () => {
    expect(allocations("Subject pronouns")).toEqual([
      "1A-2",
      "1A-4",
      "1B-1",
      "1B-2",
      "1B-4",
    ]);
    expect(allocations("Object pronouns")).toEqual(["3B-3", "3B-6", "5B-1"]);
    expect(allocations("Possessive pronouns")).toEqual(["5A-4"]);
    expect(allocations("Reflexive pronouns")).toEqual(["4A-6", "6B-5"]);
    expect(allocations("-ed / -ing adjectives")).toEqual(["6A-5"]);
    expect(allocations("Comparative adjectives")).toEqual(["4A-3", "4A-4"]);
    expect(allocations("Could (past abilities)")).toEqual(["4A-5"]);
    expect(allocations("Need to (be)")).toEqual(["4B-3", "6A-2"]);
    expect(allocations("Unless")).toEqual(["6B-4"]);
    expect(allocations("Either … or / neither … nor")).toEqual(["6A-4"]);
    expect(allocations("Gerunds")).toEqual([
      "2B-5",
      "3B-5",
      "4A-1",
      "5B-4",
      "6B-3",
      "6B-5",
      "6B-6",
    ]);
  });
});
